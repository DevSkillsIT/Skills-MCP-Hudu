/**
 * Utility functions for stripping HTML and formatting text for MCP tool output.
 * No external dependencies — pure TypeScript.
 */

/**
 * Strips HTML markup from a string, decodes HTML entities, and normalises
 * whitespace so the result is plain readable text.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Additional named entities commonly found in Hudu content
    .replace(/&ordm;/g, 'o')
    .replace(/&ordf;/g, 'a')
    .replace(/&deg;/g, '°')
    .replace(/&trade;/g, '™')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&micro;/g, 'µ')
    .replace(/&plusmn;/g, '±')
    .replace(/&frac12;/g, '½')
    .replace(/&frac14;/g, '¼')
    .replace(/&frac34;/g, '¾')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&bull;/g, '•')
    .replace(/&middot;/g, '·')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&euro;/g, '€')
    .replace(/&pound;/g, '£')
    .replace(/&yen;/g, '¥')
    .replace(/&cent;/g, '¢')
    // Portuguese (pt-BR) named entities — vowels with accents and cedilla.
    // Hudu articles written in Portuguese come back with these escaped.
    .replace(/&Aacute;/g, 'Á').replace(/&aacute;/g, 'á')
    .replace(/&Eacute;/g, 'É').replace(/&eacute;/g, 'é')
    .replace(/&Iacute;/g, 'Í').replace(/&iacute;/g, 'í')
    .replace(/&Oacute;/g, 'Ó').replace(/&oacute;/g, 'ó')
    .replace(/&Uacute;/g, 'Ú').replace(/&uacute;/g, 'ú')
    .replace(/&Acirc;/g, 'Â').replace(/&acirc;/g, 'â')
    .replace(/&Ecirc;/g, 'Ê').replace(/&ecirc;/g, 'ê')
    .replace(/&Ocirc;/g, 'Ô').replace(/&ocirc;/g, 'ô')
    .replace(/&Atilde;/g, 'Ã').replace(/&atilde;/g, 'ã')
    .replace(/&Otilde;/g, 'Õ').replace(/&otilde;/g, 'õ')
    .replace(/&Agrave;/g, 'À').replace(/&agrave;/g, 'à')
    .replace(/&Egrave;/g, 'È').replace(/&egrave;/g, 'è')
    .replace(/&Igrave;/g, 'Ì').replace(/&igrave;/g, 'ì')
    .replace(/&Ograve;/g, 'Ò').replace(/&ograve;/g, 'ò')
    .replace(/&Ugrave;/g, 'Ù').replace(/&ugrave;/g, 'ù')
    .replace(/&Ccedil;/g, 'Ç').replace(/&ccedil;/g, 'ç')
    .replace(/&Auml;/g, 'Ä').replace(/&auml;/g, 'ä')
    .replace(/&Euml;/g, 'Ë').replace(/&euml;/g, 'ë')
    .replace(/&Iuml;/g, 'Ï').replace(/&iuml;/g, 'ï')
    .replace(/&Ouml;/g, 'Ö').replace(/&ouml;/g, 'ö')
    .replace(/&Uuml;/g, 'Ü').replace(/&uuml;/g, 'ü')
    .replace(/&Ntilde;/g, 'Ñ').replace(/&ntilde;/g, 'ñ')
    .replace(/&szlig;/g, 'ß')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Escapes a value for embedding in a Markdown table cell.
 *
 * Pipes need escaping, and so do newlines: a raw newline ends the table row,
 * so every row after it stops being parsed as part of the table. That was
 * latent while cell contents were short names, and became reachable with
 * free-text fields — a flag's reason and a task's notes are written by hand and
 * routinely span lines.
 *
 * Returns an empty string for null / undefined values.
 */
export function escapeMarkdown(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\r\n?|\n/g, " ")
    .replace(/ {2,}/g, " ");
}

/**
 * Strips HTML from `text`, then truncates the result to `maxLen` characters
 * (appending "…" when truncated). The returned string is Markdown-safe.
 * Returns an empty string for null / undefined input.
 */
export function truncate(
  text: string | null | undefined,
  maxLen = 200
): string {
  if (!text) return "";
  const clean = stripHtml(text);
  if (clean.length <= maxLen) return escapeMarkdown(clean);
  return escapeMarkdown(clean.slice(0, maxLen)) + "...";
}
