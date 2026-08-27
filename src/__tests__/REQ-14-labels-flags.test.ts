/**
 * REQ-14 — Labels and Flags
 *
 * Hudu 2.44.3 exposes /labels + /label_types and /flags + /flag_types over the
 * public REST API. The MCP covered neither. The official Hudu MCP added labels
 * in 2026-08; flags it still does not have.
 *
 * Two behaviours are worth pinning down beyond plain CRUD:
 *
 *  - apply/flag must be idempotent. Labels have a unique index, so a second
 *    apply would be a validation error rather than the no-op the caller means.
 *    Flags have no such index, so a second flag would silently duplicate.
 *  - remove/unflag take the (type, record) triple the caller knows, but the API
 *    deletes by the assignment id, which the caller never sees. The tool has to
 *    look it up.
 */

import {
  executeLabelsTool,
  executeLabelTypesTool,
  executeLabelTypesQueryTool,
} from '../tools/labels.js';
import { executeFlagsTool, executeFlagTypesTool } from '../tools/flags.js';
import { formatLabelList, formatFlagList, toPagedResponse } from '../formatters/markdown.js';
import type { HuduClient } from '../hudu-client.js';

type Calls = { name: string; args: any[] }[];

function fakeClient(overrides: Record<string, any> = {}): { client: HuduClient; calls: Calls } {
  const calls: Calls = [];
  const record =
    (name: string, impl: (...a: any[]) => any) =>
    (...args: any[]) => {
      calls.push({ name, args });
      return Promise.resolve(impl(...args));
    };

  const base: Record<string, any> = {
    getLabels: () => [],
    getLabelTypes: () => [{ id: 7, name: 'crítico', color: '#ff0000' }],
    createLabel: (l: any) => ({ id: 500, ...l }),
    deleteLabel: () => undefined,
    getLabel: (id: number) => ({ id, label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 }),
    createLabelType: (t: any) => ({ id: 900, ...t }),
    updateLabelType: (id: number, t: any) => ({ id, ...t }),
    getFlags: () => [],
    getFlagTypes: () => [{ id: 4, name: 'revisar', color: '#00ff00' }],
    createFlag: (f: any) => ({ id: 600, ...f }),
    deleteFlag: () => undefined,
    createFlagType: (t: any) => ({ id: 800, ...t }),
    ...overrides,
  };

  const client: Record<string, any> = {};
  for (const [name, impl] of Object.entries(base)) client[name] = record(name, impl as any);
  return { client: client as unknown as HuduClient, calls };
}

describe('REQ-14 — applying a label', () => {
  it('creates the assignment when the record does not carry it', async () => {
    const { client, calls } = fakeClient();
    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 },
      client
    );

    expect(res.success).toBe(true);
    expect(calls.some((c) => c.name === 'createLabel')).toBe(true);
    expect(res.data.label_type_name).toBe('crítico');
  });

  it('is a no-op when the label is already applied — never a validation error', async () => {
    const existing = { id: 55, label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 };
    const { client, calls } = fakeClient({ getLabels: () => [existing] });

    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 },
      client
    );

    expect(res.success).toBe(true);
    expect(res.data.id).toBe(55);
    expect(res.message).toMatch(/já estava aplicada/i);
    expect(calls.some((c) => c.name === 'createLabel')).toBe(false);
  });

  it('rejects a record type Hudu does not accept, naming the valid ones', async () => {
    const { client } = fakeClient();
    const res = await executeLabelsTool(
      { action: 'apply', label_type_id: 7, labelable_type: 'Ticket', labelable_id: 3 },
      client
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('Ticket');
    expect(res.error).toContain('AssetPassword');
  });

  it('demands the whole triple', async () => {
    const { client } = fakeClient();
    const res = await executeLabelsTool({ action: 'apply', label_type_id: 7 }, client);
    expect(res.success).toBe(false);
  });
});

describe('REQ-14 — removing a label', () => {
  it('resolves the assignment id from the triple the caller knows', async () => {
    const { client, calls } = fakeClient({
      getLabels: () => [{ id: 55, label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 }],
    });

    const res = await executeLabelsTool(
      { action: 'remove', label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 },
      client
    );

    expect(res.success).toBe(true);
    expect(res.data.removed).toBe(true);
    expect(calls.find((c) => c.name === 'deleteLabel')!.args[0]).toBe(55);
  });

  it('succeeds without deleting when the label was not applied', async () => {
    const { client, calls } = fakeClient();
    const res = await executeLabelsTool(
      { action: 'remove', label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 },
      client
    );

    expect(res.success).toBe(true);
    expect(res.data.removed).toBe(false);
    expect(calls.some((c) => c.name === 'deleteLabel')).toBe(false);
  });
});

describe('REQ-14 — label definitions', () => {
  it('sets access_level from whether companies were listed', async () => {
    const { client, calls } = fakeClient();

    await executeLabelTypesTool(
      { action: 'create', fields: { name: 'x', color: '#f00' } },
      client
    );
    expect(calls.at(-1)!.args[0].access_level).toBe('all_companies');

    await executeLabelTypesTool(
      { action: 'create', fields: { name: 'y', color: '#f00', allowed_company_ids: [3, 4] } },
      client
    );
    expect(calls.at(-1)!.args[0].access_level).toBe('specific_companies');
  });

  it('expands an omitted record-type list to every valid type', async () => {
    const { client, calls } = fakeClient();
    await executeLabelTypesTool({ action: 'create', fields: { name: 'x', color: '#f00' } }, client);
    expect(calls.at(-1)!.args[0].applicable_record_types).toContain('AssetPassword');
  });

  it('refuses an update with nothing to change instead of a no-op PUT', async () => {
    const { client } = fakeClient();
    const res = await executeLabelTypesTool({ action: 'update', id: 7, fields: {} }, client);
    expect(res.success).toBe(false);
  });

  it('trims rows to identity by default and widens with include=scope', async () => {
    const full = {
      id: 7,
      name: 'crítico',
      color: '#ff0000',
      slug: 'abc',
      applicable_record_types: ['Asset'],
      access_level: 'all_companies',
      allowed_company_ids: [],
      created_at: 'x',
      updated_at: 'y',
    };
    const { client } = fakeClient({ getLabelTypes: () => [full] });

    const trimmed = await executeLabelTypesQueryTool({}, client);
    expect(Object.keys(trimmed.data[0])).toEqual(['id', 'name', 'color', 'slug']);

    const widened = await executeLabelTypesQueryTool({ include: ['scope'] }, client);
    expect(widened.data[0]).toHaveProperty('applicable_record_types');
    expect(widened.data[0]).not.toHaveProperty('created_at');

    const unknown = await executeLabelTypesQueryTool({ include: ['nope'] }, client);
    expect(Object.keys(unknown.data[0])).toEqual(['id', 'name', 'color', 'slug']);
  });
});

describe('REQ-14 — flags', () => {
  it('does not duplicate a flag the record already carries', async () => {
    const existing = { id: 61, flag_type_id: 4, flagable_type: 'Asset', flagable_id: 3 };
    const { client, calls } = fakeClient({ getFlags: () => [existing] });

    const res = await executeFlagsTool(
      { action: 'flag', flag_type_id: 4, flagable_type: 'Asset', flagable_id: 3 },
      client
    );

    expect(res.success).toBe(true);
    expect(calls.some((c) => c.name === 'createFlag')).toBe(false);
    expect(res.message).toMatch(/já estava sinalizado/i);
  });

  it('carries the reason through when flagging', async () => {
    const { client, calls } = fakeClient();
    await executeFlagsTool(
      {
        action: 'flag',
        flag_type_id: 4,
        flagable_type: 'Asset',
        flagable_id: 3,
        description: 'senha vencida',
      },
      client
    );
    expect(calls.find((c) => c.name === 'createFlag')!.args[0].description).toBe('senha vencida');
  });

  it('unflag resolves the flag id from the triple', async () => {
    const { client, calls } = fakeClient({
      getFlags: () => [{ id: 61, flag_type_id: 4, flagable_type: 'Asset', flagable_id: 3 }],
    });
    const res = await executeFlagsTool(
      { action: 'unflag', flag_type_id: 4, flagable_type: 'Asset', flagable_id: 3 },
      client
    );
    expect(res.data.removed).toBe(true);
    expect(calls.find((c) => c.name === 'deleteFlag')!.args[0]).toBe(61);
  });

  it('requires a hex colour and a name to create a flag type', async () => {
    const { client } = fakeClient();
    const res = await executeFlagTypesTool({ action: 'create', fields: { name: 'só nome' } }, client);
    expect(res.success).toBe(false);
    expect(res.error).toContain('color');
  });
});

describe('REQ-14 — rendering', () => {
  it('shows the label name, not just its id', () => {
    const md = formatLabelList(
      toPagedResponse([
        {
          id: 1,
          label_type_id: 7,
          label_type_name: 'crítico',
          labelable_type: 'AssetPassword',
          labelable_id: 255,
        },
      ])
    );
    expect(md).toContain('crítico');
    expect(md).toContain('Senha (AssetPassword)');
  });

  it('falls back to the id when the catalogue could not be read', () => {
    const md = formatLabelList(
      toPagedResponse([
        { id: 1, label_type_id: 7, labelable_type: 'Asset', labelable_id: 3 },
      ])
    );
    expect(md).toContain('#7');
  });

  it('shows the reason a record was flagged', () => {
    const md = formatFlagList(
      toPagedResponse([
        {
          id: 1,
          flag_type_id: 4,
          flag_type_name: 'revisar',
          flagable_type: 'Company',
          flagable_id: 12,
          description: 'contrato vencendo',
        },
      ])
    );
    expect(md).toContain('revisar');
    expect(md).toContain('contrato vencendo');
    expect(md).toContain('Empresa (Company)');
  });

  it('says so plainly when nothing is flagged', () => {
    expect(formatFlagList(toPagedResponse([]))).toMatch(/Nenhum registro sinalizado/);
  });
});
