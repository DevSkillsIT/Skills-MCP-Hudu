/**
 * Guarded write: read before, write, read after, and report what actually
 * changed on the server.
 *
 * Why this exists rather than a list of validated fields. The Hudu REST API
 * coerces an unreadable value to a default and stores it, answering 200 —
 * measured 2026-08-27:
 *
 *   due_date:       "banana" -> apagou a data que estava lá
 *   due_date:       ""       -> apagou
 *   parent_task_id: "xyz"    -> gravou 0, tarefa vira subtarefa da tarefa 0
 *   priority:       "banana" -> HTTP 500 (o enum do Rails levanta)
 *   position:       "abc"    -> ignorado
 *
 * Validating each known field client-side is what the earlier fixes did, and it
 * does not scale: `parent_task_id` was the one nobody had listed, and the next
 * field Hudu adds will be the next gap. Comparing the record before and after
 * catches the whole family, including the members not yet discovered.
 *
 * The classification matters more than the detection:
 *   - applied    — asked for it, it took. Nothing to say.
 *   - ignored    — asked for it, it did NOT take. The write silently failed.
 *   - collateral — did NOT ask for it, it changed anyway. The dangerous one:
 *                  this is where a value gets destroyed as a side effect.
 */

import { diffRequestedVsStored } from './echo-check.js';

/**
 * Fields that move on their own, or are derived from another field. Reporting
 * these as collateral would make the signal worthless — `updated_at` changes on
 * every write by definition, and `formatted_due_date` is just `due_date`
 * rendered.
 */
export const VOLATILE_FIELDS = [
  'updated_at',
  // Derived: the API recomputes these from a field the caller DID send, so
  // reporting them as collateral fires an alarm on every legitimate write.
  // Changing assigned_users moves first_assigned_user_*; changing a task's
  // parent moves the subtask counters; completing one moves the roll-ups.
  'formatted_due_date',
  'completed_date',
  'first_assigned_user_id',
  'first_assigned_user_name',
  'first_assigned_user_initials',
  'subtask_ids',
  'subtask_count',
  'has_subtasks',
  'completion_percentage',
  'total',
  'completed',
  'url',
  'share_url',
] as const;

/** Ceiling on the warning text. A procedure GET carries every nested task, and
 *  serialising that into a warning put thousands of characters of payload into
 *  the model's context for a rename. */
const MAX_WARNING_CHARS = 500;

export interface IgnoredField {
  field: string;
  requested: unknown;
  stored: unknown;
}

export interface CollateralChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface GuardedWriteReport {
  /**
   * Fields the response confirmed with the requested value. A field the
   * response does not echo is NOT here: the earlier version listed it as
   * applied, which asserted a write nobody had confirmed.
   */
  confirmed: string[];
  ignored: IgnoredField[];
  collateral: CollateralChange[];
  /** Set when the before-read failed, so collateral could not be computed. */
  readBackUnavailable?: string;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    // The server reorders collections (assigned_users comes back sorted by id).
    // Comparing serialised order reported every reorder as "did not write".
    if (a.length !== b.length) return false;
    const sa = [...a].map((x) => JSON.stringify(x)).sort();
    const sb = [...b].map((x) => JSON.stringify(x)).sort();
    return sa.every((x, i) => x === sb[i]);
  }
  if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return String(a) === String(b);
}

/** Fields present in either snapshot that changed, minus the volatile ones. */
/**
 * Fields present in BOTH snapshots whose value changed.
 *
 * Intersection, not union. A GET and a PUT on the same record do not have to
 * return the same projection, and treating a key the PUT simply did not echo
 * as "destroyed" turns this module inside out: it would report a full record
 * as wiped and then tell the caller to restore it — a defence against
 * destructive writes inducing one. `echo-check.ts` already documents that
 * absence is not divergence; this now agrees with it.
 */
function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  volatile: readonly string[]
): CollateralChange[] {
  const out: CollateralChange[] = [];
  for (const field of Object.keys(before)) {
    if (volatile.includes(field)) continue;
    if (!(field in after)) continue;
    if (sameValue(before[field], after[field])) continue;
    out.push({ field, before: before[field], after: after[field] });
  }
  return out;
}

/** Keeps one value from dumping a nested collection into the warning. */
function brief(value: unknown): string {
  const s = JSON.stringify(value) ?? String(value);
  return s.length > 60 ? `${s.slice(0, 59)}…` : s;
}

export interface GuardedWriteInput<T> {
  /** Reads the record as it stands now. May throw — collateral is then skipped. */
  readBefore: () => Promise<T>;
  /** Performs the write and returns whatever the API answered. */
  write: () => Promise<T>;
  /** The fields the caller asked to change. */
  requested: Record<string, unknown>;
  volatile?: readonly string[];
}

export async function guardedWrite<T extends Record<string, unknown>>({
  readBefore,
  write,
  requested,
  volatile = VOLATILE_FIELDS,
}: GuardedWriteInput<T>): Promise<{ record: T; report: GuardedWriteReport }> {
  let before: T | null = null;
  let readBackUnavailable: string | undefined;

  try {
    before = await readBefore();
  } catch (error: any) {
    // Never let the safety net block the write it was meant to observe.
    readBackUnavailable = String(error?.message ?? 'a leitura anterior falhou');
  }

  const record = await write();

  const ignored = diffRequestedVsStored(requested, record as Record<string, unknown>);
  const stored = record as Record<string, unknown>;
  const ignoredFields = new Set(ignored.map((d) => d.field));
  const confirmed = Object.keys(requested).filter(
    (f) => requested[f] !== undefined && !ignoredFields.has(f) && f in stored
  );

  const collateral = before
    ? changedFields(before, record as Record<string, unknown>, volatile).filter(
        (c) => !(c.field in requested)
      )
    : [];

  const report: GuardedWriteReport = { confirmed, ignored, collateral };
  if (readBackUnavailable) report.readBackUnavailable = readBackUnavailable;
  return { record, report };
}

/** One sentence describing everything worth flagging, or null when all is well. */
export function describeGuardedWrite(report: GuardedWriteReport): string | null {
  const parts: string[] = [];

  if (report.collateral.length) {
    const lista = report.collateral
      .map((c) => `${c.field}: ${brief(c.before)} → ${brief(c.after)}`)
      .join('; ');
    parts.push(
      `Campos que NÃO foram pedidos estão diferentes do que estavam antes — ${lista}. ` +
        'Pode ser efeito colateral do servidor OU edição de outra pessoa entre a leitura e a ' +
        'escrita (não há bloqueio otimista nesta API). NÃO regrave o valor anterior sem antes ' +
        'confirmar com quem mexeu: fazer isso apagaria a alteração dela.'
    );
  }

  if (report.ignored.length) {
    const lista = report.ignored
      .map((d) => `${d.field}: pedido ${JSON.stringify(d.requested)}, gravado ${JSON.stringify(d.stored)}`)
      .join('; ');
    parts.push(
      `A API respondeu sucesso mas NÃO gravou — ${lista}. ` +
        'Campos estruturais (name, position, description) só valem em processo; ' +
        'prazo, prioridade e responsáveis só valem em execução.'
    );
  }

  if (report.readBackUnavailable) {
    parts.push(
      `Não foi possível ler o registro antes da escrita (${report.readBackUnavailable}), ` +
        'então alterações colaterais não foram verificadas.'
    );
  }

  if (!parts.length) return null;
  const msg = `ATENÇÃO: ${parts.join(' ')}`;
  return msg.length > MAX_WARNING_CHARS ? `${msg.slice(0, MAX_WARNING_CHARS - 1)}…` : msg;
}
