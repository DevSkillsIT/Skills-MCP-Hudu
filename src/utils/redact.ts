/**
 * Redaction for text and payloads that leave the process — API error bodies
 * folded into exception messages, and the arguments logged for every tool call.
 * Both reach the winston DailyRotateFile on disk AND the LLM's context.
 *
 * The repo masks secrets on the success path (`src/tools/search.ts` blanks
 * `password` and `otp_secret`; `formatPasswordDetail` renders `| Senha | **** |`).
 * These two paths had nothing.
 *
 * ## Why this is not an entropy heuristic
 *
 * The first version masked any long high-entropy run and any word following a
 * trigger word. An audit showed it failing in both directions at once:
 *
 *   masked too much   "api_key is invalid"        -> "api_key is ****"
 *                     "Password must include..."  -> "Password **** include..."
 *                     "Name SRV_BACKUP_PRINC_2026 has already been taken"
 *                                                 -> the colliding name erased
 *   masked too little "chave de API invalida: hu_XXXXXXXXXXXXXXXX"  (no match)
 *
 * A message the model cannot act on is the failure this module exists to
 * prevent, so guessing by entropy is the wrong trade. What replaces it:
 *
 *   1. A trigger word followed by an EXPLICIT assignment (`:`, `=`) or quotes.
 *      "api_key: X" and 'Password "X"' are assignments; "api_key is invalid"
 *      is prose and stays intact.
 *   2. Values carrying a known secret prefix, wherever they appear.
 *   3. `Bearer <token>`, which is an assignment written with a space.
 *
 * Unlabelled, prefix-less secrets are not masked. That is a deliberate gap:
 * an API error that quotes a secret labels it, and the alternative was erasing
 * asset names out of the one message that says which name collided.
 */

export const MASK = '****';

/** Cap on any single error message. Long bodies are almost never informative. */
export const MAX_ERROR_CHARS = 400;

const SECRET_WORDS =
  'api[_-]?keys?|apikey|chave(?:[_ -]de[_ -]api)?|access[_-]?token|refresh[_-]?token|' +
  'auth[_-]?token|tokens?|passwords?|passwd|pass|senhas?|secrets?|segredos?|' +
  'otp(?:[_-]?secret)?|private[_-]?key|client[_-]?secret|credential|credencial';

/**
 * Trigger word + an explicit assignment. The separator is REQUIRED — that is
 * what keeps prose ("token expired", "senha nao pode ficar em branco") intact.
 */
const ASSIGNED_VALUE = new RegExp(
  `\\b(${SECRET_WORDS})\\b(\\s*(?::|=>|=)\\s*)(["']?)([^\\s"',;)\\]}]+)\\3`,
  'gi'
);

/** Trigger word followed by a quoted value: `Password "hunter2" has been taken`. */
const QUOTED_VALUE = new RegExp(`\\b(${SECRET_WORDS})\\b(\\s+)(["'])([^"']+)\\3`, 'gi');

/** `Authorization: Bearer x` / `Bearer x` — an assignment written with a space. */
const BEARER = /\b(bearer)(\s+)([^\s"',;)\]}]+)/gi;

/**
 * Values that announce themselves as secrets by prefix, wherever they sit.
 * Extend this list rather than lowering a length threshold: a prefix is
 * evidence, a length is a guess.
 */
const PREFIXED_SECRET =
  /\b(?:hu|hudu|sk|pk|rk|ghp|gho|ghs|ghu|github_pat|xox[baprs]|shpat|glpat|AKIA|ASIA)[-_][A-Za-z0-9_-]{8,}\b/g;

/** JWTs: three base64url segments separated by dots. */
const JWT = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g;

/** Keys whose VALUE is a secret wherever it appears in a logged object. */
const SECRET_KEY = /^(password|passwd|pass|senha|secret|segredo|token|api[_-]?key|apikey|chave|otp_secret|private_key|client_secret|authorization|credential|credencial)$/i;

/**
 * Removes secret material from `text` and caps its length.
 * Returns the empty string for empty input.
 */
export function redactSensitive(text: string, maxChars: number = MAX_ERROR_CHARS): string {
  if (!text) return '';

  let out = text
    .replace(JWT, MASK)
    .replace(QUOTED_VALUE, (_m, word, gap, quote) => `${word}${gap}${quote}${MASK}${quote}`)
    .replace(ASSIGNED_VALUE, (_m, word, sep, quote) => `${word}${sep}${quote}${MASK}${quote}`)
    .replace(BEARER, (_m, word, gap) => `${word}${gap}${MASK}`)
    .replace(PREFIXED_SECRET, MASK);

  // This text lands in a Markdown table cell and in one log field; a raw
  // newline breaks both.
  out = out.replace(/\s*[\r\n]+\s*/g, ' ').trim();

  if (out.length > maxChars) out = `${out.slice(0, maxChars - 1)}…`;
  return out;
}

/**
 * Deep-copies a value with secret-bearing keys blanked, for logging.
 *
 * `server.ts` logs the arguments of every tool call, and
 * `hudu_manage_password_credentials` takes `fields.password` as a plain
 * string — so every password created or changed through this MCP was written
 * to disk in the clear, with 14 days of rotation. Redacting the error path
 * while leaving that open would have been tidying the smaller hole.
 */
export function redactPayload(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value;

  if (typeof value === 'string') return redactSensitive(value, 200);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redactPayload(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEY.test(key) ? MASK : redactPayload(v, depth + 1);
  }
  return out;
}
