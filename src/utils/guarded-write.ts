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
  'formatted_due_date',
  'completed_date',
] as const;

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
  applied: string[];
  ignored: IgnoredField[];
  collateral: CollateralChange[];
  /** Set when the before-read failed, so collateral could not be computed. */
  readBackUnavailable?: string;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return String(a) === String(b);
}

/** Fields present in either snapshot that changed, minus the volatile ones. */
function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  volatile: readonly string[]
): CollateralChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out: CollateralChange[] = [];
  for (const field of keys) {
    if (volatile.includes(field)) continue;
    if (sameValue(before[field], after[field])) continue;
    out.push({ field, before: before[field], after: after[field] });
  }
  return out;
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
  const ignoredFields = new Set(ignored.map((d) => d.field));
  const applied = Object.keys(requested).filter(
    (f) => requested[f] !== undefined && !ignoredFields.has(f)
  );

  const collateral = before
    ? changedFields(before, record as Record<string, unknown>, volatile).filter(
        (c) => !(c.field in requested)
      )
    : [];

  const report: GuardedWriteReport = { applied, ignored, collateral };
  if (readBackUnavailable) report.readBackUnavailable = readBackUnavailable;
  return { record, report };
}

/** One sentence describing everything worth flagging, or null when all is well. */
export function describeGuardedWrite(report: GuardedWriteReport): string | null {
  const parts: string[] = [];

  if (report.collateral.length) {
    const lista = report.collateral
      .map((c) => `${c.field}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`)
      .join('; ');
    parts.push(
      `A escrita alterou campos que NÃO foram pedidos — ${lista}. ` +
        'A API do Hudu converte valor ilegível em vazio e grava, respondendo sucesso; ' +
        'confira se algum desses precisa ser restaurado.'
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

  return parts.length ? `ATENÇÃO: ${parts.join(' ')}` : null;
}
