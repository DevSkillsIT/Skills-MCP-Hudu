/**
 * BUG-18 — a rejected value erased the field it was meant to set
 *
 * Live proof on a run task (Hudu 2.44.3, 2026-08-27), reading back through the
 * REST API after each write:
 *
 *   due_date="2026-12-31"  -> 200, servidor: 2026-12-31
 *   due_date="banana"      -> 200, servidor: None      <- apagou
 *   due_date="2026-12-31"  -> 200, restaurado
 *   due_date="12/31/2026"  -> 200, servidor: None      <- apagou
 *   due_date="31/12/2026"  -> 200, servidor: 2026-12-31
 *
 * Rails parses an unparseable date to nil and writes the nil. The response is
 * 200 and the tool reported success — so a deadline that existed is gone, and
 * nothing anywhere says so. Worse than BUG-13: that one failed to write, this
 * one destroys what was there.
 *
 * Two defences, because either alone leaves a hole:
 *
 *  1. Reject a due_date the API cannot parse BEFORE sending it. Accepted are
 *     ISO 8601 (2026-12-31) and DD/MM/YYYY (31/12/2026) — MM/DD/YYYY is NOT,
 *     which matters because the date FILTERS use MM/DD, the opposite order.
 *  2. Echo-check the write. The API answers 200 with the record; comparing what
 *     was asked against what came back catches the whole family of silent
 *     no-ops (position on a process task, description on a repeat flag) without
 *     needing to know each one in advance.
 */

import { executeProcedureTasksTool } from '../tools/procedures.js';
import { diffRequestedVsStored } from '../utils/echo-check.js';

/**
 * `before` is the record as it stands before the write. The update path now
 * reads it so it can spot a field that changed WITHOUT being asked for — the
 * erase case. A spy without `getProcedureTask` makes the guard report that it
 * could not verify, which is correct but not what these cases are about.
 */
const spy = (returns: Record<string, unknown>, before: Record<string, unknown> = {}) => {
  const calls: unknown[][] = [];
  const client = {
    getProcedureTask: (id: number) => Promise.resolve({ id, ...before }),
    updateProcedureTask: (id: number, body: unknown) => {
      calls.push([id, body]);
      return Promise.resolve({ id, ...returns });
    },
    createProcedureTask: (body: unknown) => {
      calls.push([body]);
      return Promise.resolve({ id: 1, ...returns });
    },
  } as any;
  return { client, calls };
};

describe('BUG-18 — an unparseable due_date never reaches the API', () => {
  it.each(['banana', '12/31/2026', '2026-13-45', 'amanha', '31-12-2026'])(
    'refuses %s instead of erasing the stored deadline',
    async (bad) => {
      const { client, calls } = spy({});
      const res = await executeProcedureTasksTool(
        { action: 'update', id: 3, fields: { due_date: bad } },
        client
      );
      expect(res.success).toBe(false);
      expect(calls).toHaveLength(0);
    }
  );

  it('says which formats work, and warns about the opposite order used by filters', async () => {
    const { client } = spy({});
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { due_date: '12/31/2026' } },
      client
    );
    expect(res.error).toMatch(/AAAA-MM-DD/);
    expect(res.error).toMatch(/DD\/MM/);
  });

  it.each(['2026-12-31', '31/12/2026'])('accepts %s', async (good) => {
    const { client, calls } = spy({ due_date: '2026-12-31' });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { due_date: good } },
      client
    );
    expect(res.success).toBe(true);
    expect(calls).toHaveLength(1);
  });
});

describe('BUG-18 — echo check catches a write the server swallowed', () => {
  it('flags a field that came back different from what was sent', () => {
    const d = diffRequestedVsStored({ position: 7 }, { id: 24, position: 1 });
    expect(d).toEqual([{ field: 'position', requested: 7, stored: 1 }]);
  });

  it('says nothing when the write landed', () => {
    expect(diffRequestedVsStored({ position: 7 }, { id: 24, position: 7 })).toEqual([]);
  });

  it('compares loosely enough not to cry over a number sent as a string', () => {
    expect(diffRequestedVsStored({ position: 7 }, { position: '7' })).toEqual([]);
  });

  it('ignores fields the response does not carry — absence is not divergence', () => {
    expect(diffRequestedVsStored({ name: 'x', secret: 'y' }, { name: 'x' })).toEqual([]);
  });

  it('warns rather than claiming success when the server ignored the change', async () => {
    // position on a PROCESS task: the API answers 200 and keeps the old value.
    const { client } = spy({ position: 1 });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 24, fields: { position: 7 } },
      client
    );
    expect(res.success).toBe(true);
    expect(res.warning).toMatch(/position/);
    expect(res.warning).toMatch(/7/);
    expect(res.warning).toMatch(/1/);
  });

  it('stays quiet on a write that took', async () => {
    const { client } = spy({ position: 7 }, { position: 7 });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 24, fields: { position: 7 } },
      client
    );
    // The success assertion is the point: `warning` is absent on an error
    // response too, so the negative alone would stay green if the tool threw.
    expect(res.success).toBe(true);
    expect(res.warning).toBeUndefined();
  });
});

/**
 * BUG-20 — parent_task_id, the field nobody had listed
 *
 * Measured live: `parent_task_id: "xyz"` answers HTTP 200 and stores **0**, so
 * the task claims to be a child of task 0 — a parent that cannot exist. Same
 * family as the due_date erase, found only because the record was compared
 * before and after rather than because someone thought to validate it.
 */
describe('BUG-20 — parent_task_id cannot be corrupted into 0', () => {
  it.each(['xyz', '', 'null', '1.5', -3, 0])('refuses %p', async (bad) => {
    const { client, calls } = spy({});
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: bad } },
      client
    );
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/parent_task_id/);
    expect(calls).toHaveLength(0);
  });

  it('explains the consequence, not just the rule', async () => {
    const { client } = spy({});
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: 'xyz' } },
      client
    );
    expect(res.error).toMatch(/lidos pela API como 1 e 0/i);
  });

  it('refuses a parent that does not exist', async () => {
    const { client, calls } = spy({});
    client.getProcedureTask = (id: number) =>
      id === 999 ? Promise.reject(new Error('HTTP 404')) : Promise.resolve({ id });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: 999 } },
      client
    );
    expect(res.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('accepts a real parent', async () => {
    const { client, calls } = spy({ parent_task_id: 4 }, { parent_task_id: 4 });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: 4 } },
      client
    );
    expect(res.success).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it('leaves null alone — that is how a subtask is detached', async () => {
    const { client, calls } = spy({ parent_task_id: null }, { parent_task_id: null });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: null } },
      client
    );
    expect(res.success).toBe(true);
    expect(calls).toHaveLength(1);
  });
});

describe('BUG-20 — a refusal hands over the link', () => {
  it('includes the task URL so the dead end becomes one click', async () => {
    const { client } = spy({});
    client.getProcedureTask = async (id: number) => ({
      id,
      url: 'https://hudu.example.com/procedures/9?task=3',
    });
    const res = await executeProcedureTasksTool({ action: 'complete', id: 3 }, client);
    expect(res.success).toBe(false);
    expect(res.error).toContain('https://hudu.example.com/procedures/9?task=3');
  });

  it('never turns a missing link into a second error', async () => {
    const { client } = spy({});
    client.getProcedureTask = async () => { throw new Error('boom'); };
    const res = await executeProcedureTasksTool({ action: 'complete', id: 3 }, client);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/API pública/);
  });
});

/**
 * BUG-21 — the guard checked one value and forwarded another
 *
 * `Number()` and Ruby's `String#to_i` disagree, and the API uses to_i:
 *
 *   '1e3'  -> Number 1000, to_i 1   (existence check vouched for task 1000)
 *   '0x10' -> Number 16,   to_i 0   (the very corruption the guard exists for)
 *
 * Validating with Number and sending the raw string meant the guard approved a
 * parent that was never the one written.
 */
describe('BUG-21 — numeric coercion cannot slip past the parent guard', () => {
  it.each(['1e3', '0x10', '12.0', '+12', '1_000', '12abc'])('refuses %p', async (bad) => {
    const { client, calls } = spy({});
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: bad } },
      client
    );
    expect(res.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('names the two shapes that silently become 1 and 0', async () => {
    const { client } = spy({});
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: '1e3' } },
      client
    );
    expect(res.error).toContain('1e3');
    expect(res.error).toContain('0x10');
  });

  it('accepts surrounding whitespace, which Ruby reads the same way', async () => {
    const { client, calls } = spy({ parent_task_id: 12 }, { parent_task_id: 12 });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: ' 12 ' } },
      client
    );
    expect(res.success).toBe(true);
    expect((calls[0]![1] as any).parent_task_id).toBe(12);
  });

  it('forwards the coerced number, never the original string', async () => {
    const { client, calls } = spy({ parent_task_id: 12 }, { parent_task_id: 12 });
    await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { parent_task_id: '12' } },
      client
    );
    expect((calls[0]![1] as any).parent_task_id).toBe(12);
  });
});

describe('BUG-21 — a Brazilian-format date is not reported as a failed write', () => {
  it('normalises before sending, so the echo matches', async () => {
    // The server stores 31/12/2026 as 2026-12-31. Comparing the request string
    // with the stored one accused every correct BR-format write of failing.
    const { client, calls } = spy({ due_date: '2026-12-31' }, { due_date: null });
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { due_date: '31/12/2026' } },
      client
    );
    expect(res.success).toBe(true);
    expect((calls[0]![1] as any).due_date).toBe('2026-12-31');
    expect(res.warning).toBeUndefined();
  });

  it('leaves an ISO date exactly as given', async () => {
    const { client, calls } = spy({ due_date: '2026-12-31' }, { due_date: null });
    await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { due_date: '2026-12-31' } },
      client
    );
    expect((calls[0]![1] as any).due_date).toBe('2026-12-31');
  });
});

describe('BUG-21 — the write guards do not fire on read actions', () => {
  it('lets get through even when fields carries an unwritable key', async () => {
    const client = { getProcedureTask: async (id: number) => ({ id, name: 'x' }) } as any;
    const res = await executeProcedureTasksTool(
      { action: 'get', id: 3, fields: { completed: true } },
      client
    );
    expect(res.success).toBe(true);
  });

  it('does not fire an existence lookup for the parent on a delete', async () => {
    const calls: string[] = [];
    const client = {
      getProcedureTask: async (id: number) => { calls.push('get' + id); return { id }; },
      deleteProcedureTask: async () => { calls.push('delete'); },
    } as any;
    await executeProcedureTasksTool(
      { action: 'delete', id: 3, fields: { parent_task_id: 99 } },
      client
    );
    expect(calls).toEqual(['delete']);
  });
});
