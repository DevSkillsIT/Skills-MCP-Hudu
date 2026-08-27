/**
 * Redaction for text that leaves the process — API error bodies folded into
 * exception messages, which reach BOTH the winston log on disk and the LLM's
 * context.
 *
 * The repo already masks secrets on the success path (`src/tools/search.ts`
 * blanks `password` and `otp_secret`; `formatPasswordDetail` renders
 * `| Senha | **** |`). The error path had no such defence: the Hudu API
 * answers a rejected write with a Rails validation message that can quote the
 * offending value, and an auth failure can echo the key back. Same mask
 * character (`****`) as the rest of the codebase, so the output reads the same
 * wherever a secret was removed.
 *
 * This is deliberately conservative about what it keeps: an error message is
 * only useful if the model can act on it, so the goal is to remove secrets and
 * cap size, not to strip the message down to a status code.
 */

export const MASK = '****';

/** Cap on any single error message. Long bodies are almost never informative. */
export const MAX_ERROR_CHARS = 400;

// Words that mark the value next to them as a secret, in English and pt-BR.
const SECRET_WORDS =
  'api[_-]?key|apikey|access[_-]?token|refresh[_-]?token|bearer|authorization|auth[_-]?token|token|password|passwd|senha|secret|otp(?:[_-]?secret)?|private[_-]?key|client[_-]?secret';

/** `password: "hunter2"` / `api_key = abc123` / `senha 'x'` — value follows the word. */
const LABELLED_VALUE = new RegExp(
  `\\b(${SECRET_WORDS})\\b(\\s*(?::|=|=>|\\bis\\b|\\bé\\b)?\\s*)(["']?)([^\\s"',;)\\]}]{3,})\\3`,
  'gi'
);

/** `Password "Tr0v0ada!2026" has already been taken` — quoted value after the word. */
const QUOTED_AFTER_WORD = new RegExp(`\\b(${SECRET_WORDS})\\b(\\s+)(["'])([^"']{3,})\\3`, 'gi');

/**
 * A bare high-entropy run with no label around it. Requires length plus mixed
 * classes so ordinary identifiers ("create_from_template", a long asset name,
 * an ISO timestamp) are left alone.
 */
const BARE_SECRET = /\b(?=[A-Za-z0-9_-]{24,}\b)(?=[A-Za-z0-9_-]*[a-z])(?=[A-Za-z0-9_-]*[A-Z0-9])[A-Za-z0-9_-]{24,}\b/g;

/**
 * Removes secret-looking material from `text` and caps its length.
 * Returns the empty string for empty input.
 */
export function redactSensitive(text: string, maxChars: number = MAX_ERROR_CHARS): string {
  if (!text) return '';

  let out = text
    .replace(QUOTED_AFTER_WORD, (_m, word, gap, quote) => `${word}${gap}${quote}${MASK}${quote}`)
    .replace(LABELLED_VALUE, (_m, word, sep, quote) => `${word}${sep}${quote}${MASK}${quote}`)
    .replace(BARE_SECRET, MASK);

  // Collapse newlines: this text ends up inside a Markdown table cell and in a
  // single log field, and a raw newline breaks both.
  out = out.replace(/\s*[\r\n]+\s*/g, ' ').trim();

  if (out.length > maxChars) out = `${out.slice(0, maxChars - 1)}…`;
  return out;
}
