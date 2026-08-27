/**
 * BUG-20 — validating known fields does not scale; comparing the record does
 *
 * Measured against Hudu 2.44.3 on 2026-08-27, every one answering HTTP 200:
 *
 *   due_date       "banana"  -> erased the stored date
 *   due_date       ""        -> erased
 *   parent_task_id "xyz"     -> stored 0, task claims to be a child of task 0
 *   priority       "banana"  -> HTTP 500 (Rails enum raises)
 *   position       "abc"     -> ignored
 *
 * Client-side validation caught due_date and priority because someone had
 * listed them. `parent_task_id` was the one nobody listed, and the next field
 * Hudu adds is the next gap. Reading the record before and after catches the
 * family, including the members not yet found.
 */

import {
  guardedWrite,
  describeGuardedWrite,
  VOLATILE_FIELDS,
} from '../../utils/guarded-write.js';

const task = (over: Record<string, unknown> = {}) => ({
  id: 3,
  name: 'Conferir backup',
  position: 5,
  due_date: '2026-12-31',
  priority: 'high',
  assigned_users: [3],
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('BUG-20 — guardedWrite classifies what really happened', () => {
  it('says nothing when the write did exactly what was asked', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task(),
      write: async () => task({ priority: 'low', updated_at: '2026-02-02T00:00:00Z' }),
      requested: { priority: 'low' },
    });
    expect(report.confirmed).toEqual(['priority']);
    expect(report.ignored).toEqual([]);
    expect(report.collateral).toEqual([]);
    expect(describeGuardedWrite(report)).toBeNull();
  });

  it('catches the erase: a field nobody touched came back empty', async () => {
    // Exactly the due_date case — the caller asked for priority, and the date
    // that was there is gone.
    const { report } = await guardedWrite({
      readBefore: async () => task(),
      write: async () => task({ priority: 'low', due_date: null }),
      requested: { priority: 'low' },
    });
    expect(report.collateral).toEqual([
      { field: 'due_date', before: '2026-12-31', after: null },
    ]);
    const msg = describeGuardedWrite(report)!;
    expect(msg).toMatch(/NÃO foram pedidos/);
    expect(msg).toContain('due_date');
    expect(msg).toContain('2026-12-31');
  });

  it('catches the silent no-op: asked for it, it did not take', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task(),
      write: async () => task(),
      requested: { position: 7 },
    });
    expect(report.ignored).toEqual([{ field: 'position', requested: 7, stored: 5 }]);
    expect(describeGuardedWrite(report)).toMatch(/NÃO gravou/);
  });

  it('reports both at once when both happened', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task(),
      write: async () => task({ due_date: null }),
      requested: { position: 7 },
    });
    expect(report.ignored).toHaveLength(1);
    expect(report.collateral).toHaveLength(1);
  });

  it('ignores volatile and derived fields so the signal stays worth reading', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task({ formatted_due_date: 'Dec. 31' }),
      write: async () => task({ updated_at: '2099-01-01', formatted_due_date: 'Jan. 1' }),
      requested: {},
    });
    expect(report.collateral).toEqual([]);
    expect(VOLATILE_FIELDS).toContain('updated_at');
  });

  it('never lets the safety net block the write it was watching', async () => {
    const { record, report } = await guardedWrite({
      readBefore: async () => { throw new Error('403 forbidden'); },
      write: async () => task({ priority: 'low' }),
      requested: { priority: 'low' },
    });
    expect(record.priority).toBe('low');
    expect(report.collateral).toEqual([]);
    expect(report.readBackUnavailable).toContain('403');
    expect(describeGuardedWrite(report)).toMatch(/não foram verificadas/i);
  });

  it('does not report a requested field as collateral — that is the ignored bucket', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task(),
      write: async () => task({ due_date: null }),
      requested: { due_date: 'banana' },
    });
    expect(report.collateral).toEqual([]);
    expect(report.ignored).toHaveLength(1);
  });

  it('treats a number restated as a string as unchanged', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task({ position: 5 }),
      write: async () => task({ position: '5' }),
      requested: {},
    });
    expect(report.collateral).toEqual([]);
  });

  it('notices a field that appeared or disappeared entirely', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => task({ parent_task_id: 4 }),
      write: async () => task({ parent_task_id: 0 }),
      requested: {},
    });
    expect(report.collateral).toEqual([{ field: 'parent_task_id', before: 4, after: 0 }]);
  });
});

/**
 * BUG-21 — the failure modes an adversarial audit found in the first version
 *
 * Each of these made the guard cry wolf on a correct write. That is not a
 * cosmetic problem: the warning tells the caller a value may need restoring, so
 * a false alarm invites the model to write the old value back over somebody's
 * real edit. A defence that induces the damage it guards against is worse than
 * no defence.
 */
describe('BUG-21 — the guard does not cry wolf', () => {
  it('does not report a key the response simply did not echo', () => {
    // A GET and a PUT need not return the same projection. The union-of-keys
    // version reported the entire un-echoed record as destroyed and told the
    // caller to restore it.
    const before = { id: 3, name: 'x', due_date: '2026-12-31', description: 'passo a passo', url: 'https://h/t' };
    const after = { id: 3, name: 'y' };
    return guardedWrite({
      readBefore: async () => before,
      write: async () => after,
      requested: { name: 'y' },
    }).then(({ report }) => {
      expect(report.collateral).toEqual([]);
      expect(describeGuardedWrite(report)).toBeNull();
    });
  });

  it('survives a degenerate response body without declaring the record wiped', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 9, name: 'x', description: 'faz X', company_id: 4 }),
      write: async () => ({ success: true } as any),
      requested: { name: 'y' },
    });
    expect(report.collateral).toEqual([]);
  });

  it('stays quiet when the server reorders an array', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 3, assigned_users: [3] }),
      write: async () => ({ id: 3, assigned_users: [3, 7] }),
      requested: { assigned_users: [7, 3] },
    });
    expect(report.ignored).toEqual([]);
    expect(describeGuardedWrite(report)).toBeNull();
  });

  it('stays quiet on the fields the API derives from what was sent', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 3, assigned_users: [3], first_assigned_user_id: 3, first_assigned_user_name: 'Ana' }),
      write: async () => ({ id: 3, assigned_users: [7], first_assigned_user_id: 7, first_assigned_user_name: 'Bruno' }),
      requested: { assigned_users: [7] },
    });
    expect(report.collateral).toEqual([]);
    // and never puts a person's name in a warning as a side effect
    expect(describeGuardedWrite(report) ?? '').not.toContain('Bruno');
  });

  it('still catches a genuine erase, with both keys present', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 3, name: 'x', due_date: '2026-12-31' } as Record<string, unknown>),
      write: async () => ({ id: 3, name: 'y', due_date: null } as Record<string, unknown>),
      requested: { name: 'y' },
    });
    expect(report.collateral).toEqual([{ field: 'due_date', before: '2026-12-31', after: null }]);
  });

  it('names the concurrent-edit possibility and warns against blind restore', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 3, name: 'x', description: 'a' }),
      write: async () => ({ id: 3, name: 'y', description: 'b' }),
      requested: { name: 'y' },
    });
    const msg = describeGuardedWrite(report)!;
    expect(msg).toMatch(/outra pessoa/i);
    expect(msg).toMatch(/NÃO regrave/);
  });

  it('caps the warning so a nested collection cannot flood the context', async () => {
    const tasks = Array.from({ length: 40 }, (_, i) => ({ id: i, name: `tarefa numero ${i}`, description: 'x'.repeat(50) }));
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 9, name: 'x', tasks }),
      write: async () => ({ id: 9, name: 'y', tasks: [] }),
      requested: { name: 'y' },
    });
    const msg = describeGuardedWrite(report)!;
    expect(msg.length).toBeLessThanOrEqual(500);
  });

  it('confirmed lists only fields the response actually echoed back', async () => {
    const { report } = await guardedWrite({
      readBefore: async () => ({ id: 3, name: 'x' }),
      write: async () => ({ id: 3, name: 'y' }),
      requested: { name: 'y', description: 'nao ecoado' },
    });
    expect(report.confirmed).toEqual(['name']);
  });
});
