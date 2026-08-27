/**
 * Echo verification for writes.
 *
 * The Hudu API answers a rejected or ignored field with HTTP 200 and the record
 * unchanged. The MCP read that as proof the write happened, which produced a
 * family of silent failures found in the 2026-08-27 audit:
 *
 *   - an unparseable `due_date` erased the deadline that was there
 *   - `position` on a process task returned 200 and kept the old value
 *   - re-flagging with a new `description` kept the old reason
 *   - `completed` was dropped by strong params entirely
 *
 * In every case the response body the client already holds contradicts the
 * claim being made about it. Comparing request against response catches the
 * whole family, including the members nobody has found yet.
 */

export interface EchoDivergence {
  field: string;
  requested: unknown;
  stored: unknown;
}

/**
 * Loose equality: the API restates numbers as strings, and reorders
 * collections (assigned_users comes back sorted by id). Comparing serialised
 * order reported every reorder as "the API did not write this".
 */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sa = [...a].map((x) => JSON.stringify(x)).sort();
    const sb = [...b].map((x) => JSON.stringify(x)).sort();
    return sa.every((x, i) => x === sb[i]);
  }
  if (typeof a === 'object' || typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return String(a) === String(b);
}

/**
 * Fields that were asked for and did not come back as asked.
 *
 * A field absent from the response is NOT a divergence: many endpoints return a
 * projection, and treating absence as failure would cry wolf on every write.
 * Only a field that came back with a DIFFERENT value is reported.
 */
export function diffRequestedVsStored(
  requested: Record<string, unknown>,
  stored: Record<string, unknown> | null | undefined
): EchoDivergence[] {
  if (!stored || typeof stored !== 'object') return [];

  const out: EchoDivergence[] = [];
  for (const [field, value] of Object.entries(requested)) {
    if (value === undefined) continue;
    if (!(field in stored)) continue;
    if (sameValue(value, stored[field])) continue;
    out.push({ field, requested: value, stored: stored[field] });
  }
  return out;
}

/** Human-facing sentence for a set of divergences, or null when there are none. */
export function describeEchoDivergence(diffs: EchoDivergence[]): string | null {
  if (!diffs.length) return null;
  const lista = diffs
    .map((d) => `${d.field}: pedido ${JSON.stringify(d.requested)}, gravado ${JSON.stringify(d.stored)}`)
    .join('; ')
  return (
    'ATENÇÃO: a API respondeu sucesso mas NÃO gravou tudo que foi pedido — ' +
    `${lista}. O valor mostrado abaixo é o que está no servidor, não o que você pediu. ` +
    'Campos estruturais (name, position, description) só valem em processo; ' +
    'prazo, prioridade e responsáveis só valem em execução.'
  );
}
