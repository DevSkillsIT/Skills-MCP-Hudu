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
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Escapes pipe characters so values are safe to embed in Markdown tables.
 * Returns an empty string for null / undefined values.
 */
export function escapeMarkdown(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\|/g, "\\|");
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
