/**
 * Existence check before attaching a label or a flag to a record.
 *
 * The Hudu API happily creates a Label or a Flag pointing at an id that does
 * not exist — verified 2026-08-27: `apply(label_type, Article 999999)` created
 * assignment 92 while `GET /articles/999999` returned null. The orphan then
 * appears as an ordinary row in "what is flagged", indistinguishable from a
 * real pendency, and nothing ever cleans it up. One mistyped id becomes a
 * permanent phantom in the audit.
 *
 * Fail-closed only on a definite "not found". A check that fails for any other
 * reason (permissions, transport) must not block a legitimate write, and must
 * not claim the record was verified either — the caller is told the check did
 * not happen.
 */

type Getter = (client: any, id: number) => Promise<unknown>;

const GETTERS: Record<string, Getter> = {
  Article: (c, id) => c.getArticle(id),
  Asset: (c, id) => c.getAsset(id),
  AssetPassword: (c, id) => c.getAssetPassword(id),
  Company: (c, id) => c.getCompany(id),
  IpAddress: (c, id) => c.getIpAddress(id),
  Network: (c, id) => c.getNetwork(id),
  Procedure: (c, id) => c.getProcedure(id),
  RackStorage: (c, id) => c.getRackStorage(id),
  Vlan: (c, id) => c.getVlan(id),
  VlanZone: (c, id) => c.getVlanZone(id),
  Website: (c, id) => c.getWebsite(id),
};

export type ExistenceResult =
  | { state: 'exists' }
  | { state: 'missing'; message: string }
  | { state: 'unchecked'; reason: string };

export async function checkRecordExists(
  client: unknown,
  type: string,
  id: number
): Promise<ExistenceResult> {
  const getter = GETTERS[type];
  if (!getter) return { state: 'unchecked', reason: `sem consulta disponível para ${type}` };

  try {
    const record = await getter(client, id);
    if (record && typeof record === 'object' && 'id' in (record as Record<string, unknown>)) {
      return { state: 'exists' };
    }
    return {
      state: 'missing',
      message: `${type} ${id} não existe no Hudu. A API aceitaria criar a marcação assim mesmo, e ela viraria uma pendência fantasma permanente no levantamento.`,
    };
  } catch (error: any) {
    const msg = String(error?.message ?? '');

    // Our own client raises this when it falls back to a list lookup it cannot
    // scope. The record may exist and simply not be visible to this key — the
    // FilteredHuduClient allowlist reaches here too. Calling that "does not
    // exist" would refuse a legitimate write with a false statement.
    if (/tip: pass company_id/i.test(msg)) {
      return {
        state: 'unchecked',
        reason: `a consulta de ${type} ${id} não pôde ser escopada (pode existir e não estar visível para esta chave)`,
      };
    }

    // Hudu answers "this id does not exist" in more than one way, verified live:
    //   GET /articles/999999  -> HTTP 200, body `null`
    //   GET /companies/999999 -> HTTP 404, JSON error
    //   GET /assets/999999    -> HTTP 404, a Rails HTML page
    if (/HTTP 404|não encontrado/i.test(msg) || /\bnot found\b/i.test(msg)) {
      return {
        state: 'missing',
        message: `${type} ${id} não existe no Hudu (a consulta devolveu 404). A API aceitaria criar a marcação assim mesmo, e ela viraria uma pendência fantasma permanente.`,
      };
    }

    // An empty body reaches us as a TypeError from the getter unwrapping null.
    // It is the article case above — but a client-side schema change would look
    // identical, so the message says what was observed instead of asserting a
    // 404 that did not happen.
    if (/Cannot read propert(y|ies) of (null|undefined)/i.test(msg)) {
      return {
        state: 'missing',
        message: `${type} ${id} não existe no Hudu: a consulta respondeu com corpo vazio. A API aceitaria criar a marcação assim mesmo, e ela viraria uma pendência fantasma permanente. Se você tem certeza de que o registro existe, isto pode ser incompatibilidade do cliente com a resposta da API — confirme o ID antes de insistir.`,
      };
    }

    return { state: 'unchecked', reason: msg || 'a consulta de verificação falhou' };
  }
}
