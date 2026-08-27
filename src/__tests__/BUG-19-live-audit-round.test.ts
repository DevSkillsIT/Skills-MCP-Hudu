/**
 * BUG-19 — findings from the black-box audit, all reconfirmed live before fixing
 *
 * The pattern behind most of them: the MCP read HTTP 200 as proof a write
 * happened, on an API that answers 200 with the record unchanged. In every case
 * the response body already in hand contradicted the claim being made about it.
 */

import { executeProceduresQueryTool, executeProcedureTasksQueryTool } from '../tools/procedures.js';
import { executeFlagsTool, executeFlagsQueryTool } from '../tools/flags.js';
import { executeLabelsTool, executeLabelsQueryTool } from '../tools/labels.js';
import { formatProcedureTaskList, formatProcedureTaskDetail, toPagedResponse } from '../formatters/markdown.js';
import { dateFilterProperties } from '../tools/schema-utils.js';

const procs = [
  { id: 1, name: 'Skills IT', description: '', archived: false, created_at: '', updated_at: '' },
  { id: 6, name: 'teste de restore', description: '', archived: false, created_at: '', updated_at: '' },
  { id: 9, name: 'Rearm dos Servidores', description: 'firewall', archived: false, created_at: '', updated_at: '' },
] as any[];

describe('BUG-19 — procedures search actually filters now', () => {
  const client = { getProcedures: async () => procs } as any;

  it('matches a partial name, which the API cannot do (name is exact there)', async () => {
    const res = await executeProceduresQueryTool({ search: 'Rearm' }, client);
    expect(res.data.map((p: any) => p.id)).toEqual([9]);
  });

  it('matches case-insensitively and on the description too', async () => {
    expect((await executeProceduresQueryTool({ search: 'rearm' }, client)).data).toHaveLength(1);
    expect((await executeProceduresQueryTool({ search: 'FIREWALL' }, client)).data).toHaveLength(1);
  });

  it('returns nothing for a term that matches nothing — not the whole collection', async () => {
    const res = await executeProceduresQueryTool({ search: 'zzzzzzzz' }, client);
    expect(res.data).toEqual([]);
  });

  it('says the filter was applied locally, and why', async () => {
    const res = await executeProceduresQueryTool({ search: 'Rearm' }, client);
    expect(res.warning).toMatch(/localmente/i);
    expect(res.warning).toMatch(/ignora o parâmetro search/i);
  });

  it('treats `name` as the same partial term', async () => {
    expect((await executeProceduresQueryTool({ name: 'Skills' }, client)).data).toHaveLength(1);
  });

  it('does not filter, or warn, when no term was given', async () => {
    const res = await executeProceduresQueryTool({}, client);
    expect(res.data).toHaveLength(3);
    expect(res.warning).toBeUndefined();
  });

  it('refuses a type outside the enum instead of returning everything', async () => {
    const res = await executeProceduresQueryTool({ type: 'banana' }, client);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/coleção inteira/i);
  });

  it('routes a task search to `name`, which IS partial server-side there', async () => {
    const calls: any[] = [];
    const c = { getProcedureTasks: async (p: any) => { calls.push(p); return []; } } as any;
    await executeProcedureTasksQueryTool({ search: 'Rear' }, c);
    expect(calls[0]).toEqual({ name: 'Rear' });
  });
});

describe('BUG-19 — a marking cannot be attached to a record that does not exist', () => {
  const base = {
    getLabels: async () => [],
    getLabelTypes: async () => [{ id: 7, name: 'x', color: '#f00' }],
    createLabel: async (l: any) => ({ id: 1, ...l }),
    getFlags: async () => [],
    getFlagTypes: async () => [{ id: 4, name: 'y', color: 'Grey' }],
    createFlag: async (f: any) => ({ id: 1, ...f }),
  };

  it('refuses to label a missing article, naming the consequence', async () => {
    const client = { ...base, getArticle: async () => { throw new Error('HTTP 404: not found'); } } as any;
    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Article', labelable_id: 999999 },
      client
    );
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/fantasma/i);
  });

  it('refuses to flag a missing company', async () => {
    const client = { ...base, getCompany: async () => { throw new Error('HTTP 404: not found'); } } as any;
    const res = await executeFlagsTool(
      { action: 'flag', flag_type_id: 4, flagable_type: 'Company', flagable_id: 999999 },
      client
    );
    expect(res.success).toBe(false);
  });

  it('proceeds when the record is there', async () => {
    const client = { ...base, getArticle: async (id: number) => ({ id, name: 'a' }) } as any;
    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Article', labelable_id: 5 },
      client
    );
    expect(res.success).toBe(true);
  });

  it('treats a 200 with an empty body as missing — Hudu answers that way for articles', async () => {
    // GET /articles/999999 returns HTTP 200 and `null`; the getter then throws
    // a TypeError unwrapping it. Same answer as a 404, different shape.
    const client = {
      ...base,
      getArticle: async () => { throw new TypeError("Cannot read properties of null (reading 'article')"); },
    } as any;
    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Article', labelable_id: 999999 },
      client
    );
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/fantasma/i);
  });

  it('does not block when the check itself fails, but says it did not happen', async () => {
    const client = { ...base, getArticle: async () => { throw new Error('socket hang up'); } } as any;
    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Article', labelable_id: 5 },
      client
    );
    expect(res.success).toBe(true);
    expect(res.warning).toMatch(/Não foi possível confirmar/i);
  });
});

describe('BUG-19 — a repeat flag does not swallow a new reason', () => {
  const existing = { id: 8, flag_type_id: 6, flagable_type: 'Company', flagable_id: 1, description: 'MOTIVO-ORIGINAL' };
  const client = {
    getFlags: async () => [existing],
    getFlagTypes: async () => [{ id: 6, name: 'rev', color: 'Grey' }],
    createFlag: async () => { throw new Error('should not be called'); },
  } as any;

  it('warns that the new reason was not stored, and points at update', async () => {
    const res = await executeFlagsTool(
      { action: 'flag', flag_type_id: 6, flagable_type: 'Company', flagable_id: 1, description: 'MOTIVO-NOVO' },
      client
    );
    expect(res.success).toBe(true);
    expect(res.warning).toMatch(/NÃO foi gravado/);
    expect(res.warning).toMatch(/MOTIVO-ORIGINAL/);
    expect(res.warning).toMatch(/action="update"/);
  });

  it('stays quiet when the same reason is sent again', async () => {
    const res = await executeFlagsTool(
      { action: 'flag', flag_type_id: 6, flagable_type: 'Company', flagable_id: 1, description: 'MOTIVO-ORIGINAL' },
      client
    );
    expect(res.success).toBe(true);
    expect(res.warning).toBeUndefined();
  });
});

describe('BUG-19 — an out-of-enum search filter is refused, not answered with "nothing"', () => {
  const c = { getLabels: async () => [], getFlags: async () => [], getLabelTypes: async () => [], getFlagTypes: async () => [] } as any;

  it('rejects the wrong case, which used to read as a fact', async () => {
    const res = await executeLabelsQueryTool({ labelable_type: 'asset' }, c);
    expect(res.success).toBe(false);
    expect(res.error).toContain('asset');
  });

  it('explains that Company is valid for flags but not for labels', async () => {
    const res = await executeLabelsQueryTool({ labelable_type: 'Company' }, c);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/não aceitam Company/i);
  });

  it('accepts Company on the flag side', async () => {
    expect((await executeFlagsQueryTool({ flagable_type: 'Company' }, c)).success).toBe(true);
  });
});

describe('BUG-19 — task owners and date filters stop misleading', () => {
  it('marks that more owners exist than the one named', () => {
    const md = formatProcedureTaskList(
      toPagedResponse([{ id: 1, name: 't', completed: false, first_assigned_user_name: 'Ana', assigned_users: [3, 4, 8] }])
    );
    expect(md).toContain('Ana +2');
  });

  it('names one owner without a counter', () => {
    const md = formatProcedureTaskList(
      toPagedResponse([{ id: 1, name: 't', completed: false, first_assigned_user_name: 'Ana', assigned_users: [3] }])
    );
    expect(md).toContain('| Ana |');
    expect(md).not.toContain('+0');
  });

  it('excludes the principal from "demais responsáveis"', () => {
    const md = formatProcedureTaskDetail({
      id: 1, name: 't', completed: false,
      first_assigned_user_id: 3, first_assigned_user_name: 'Ana', assigned_users: [3, 4],
    });
    expect(md).toMatch(/Demais responsáveis \(IDs\) \| 4 \|/);
  });

  it('warns that the range end is exclusive and that a bad date returns everything', () => {
    for (const f of [dateFilterProperties.created_at, dateFilterProperties.updated_at]) {
      expect(f.description).toMatch(/EXCLUSIVO/);
      expect(f.description).toMatch(/IGNORADA/);
      expect(f.description).toMatch(/MM\/DD/);
    }
  });
});
