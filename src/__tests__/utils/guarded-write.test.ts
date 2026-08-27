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
    expect(report.applied).toEqual(['priority']);
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
