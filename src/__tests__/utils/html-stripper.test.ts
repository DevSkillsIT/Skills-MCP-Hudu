import { stripHtml, truncate, escapeMarkdown } from '../../utils/html-stripper.js';

describe('stripHtml', () => {
  test('removes simple tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
  });

  test('converts br to newline', () => {
    expect(stripHtml('Line1<br>Line2')).toBe('Line1\nLine2');
  });

  test('converts br self-closing to newline', () => {
    expect(stripHtml('Line1<br />Line2')).toBe('Line1\nLine2');
  });

  test('decodes &amp;', () => {
    expect(stripHtml('A &amp; B')).toBe('A & B');
  });

  test('decodes &nbsp;', () => {
    expect(stripHtml('Hello&nbsp;World')).toBe('Hello World');
  });

  test('decodes numeric decimal entity', () => {
    expect(stripHtml('&#60;script&#62;')).toBe('<script>');
  });

  test('decodes numeric hex entity', () => {
    expect(stripHtml('&#x3C;div&#x3E;')).toBe('<div>');
  });

  test('normalizes excessive newlines', () => {
    expect(stripHtml('A\n\n\n\nB')).toBe('A\n\nB');
  });

  test('handles nested tags', () => {
    expect(stripHtml('<div><p><b>Bold</b></p></div>')).toBe('Bold');
  });

  test('handles empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  test('decodes &lt; and &gt;', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
  });

  test('decodes &quot; and &apos;', () => {
    expect(stripHtml('&quot;hello&apos;')).toBe('"hello\'');
  });
});

describe('truncate', () => {
  test('returns empty for null', () => {
    expect(truncate(null)).toBe('');
  });

  test('returns empty for undefined', () => {
    expect(truncate(undefined)).toBe('');
  });

  test('does not truncate short text', () => {
    expect(truncate('Hello', 200)).toBe('Hello');
  });

  test('truncates long text with ellipsis', () => {
    const long = 'A'.repeat(300);
    const result = truncate(long, 200);
    // truncate slices at maxLen then appends "..."
    expect(result).toHaveLength(203);
    expect(result.endsWith('...')).toBe(true);
  });

  test('strips HTML before truncating', () => {
    const result = truncate('<p>Hello World</p>', 5);
    expect(result).toBe('Hello...');
  });

  test('returns full text if exactly maxLen', () => {
    const text = 'A'.repeat(200);
    expect(truncate(text, 200)).toBe(text);
  });

  test('returns empty for empty string', () => {
    expect(truncate('')).toBe('');
  });
});

describe('escapeMarkdown', () => {
  test('escapes pipe characters', () => {
    expect(escapeMarkdown('Cell|Value')).toBe('Cell\\|Value');
  });

  test('returns empty for null', () => {
    expect(escapeMarkdown(null)).toBe('');
  });

  test('returns empty for undefined', () => {
    expect(escapeMarkdown(undefined)).toBe('');
  });

  test('converts numbers', () => {
    expect(escapeMarkdown(42)).toBe('42');
  });

  test('converts booleans', () => {
    expect(escapeMarkdown(true)).toBe('true');
  });

  test('handles strings without pipes', () => {
    expect(escapeMarkdown('normal text')).toBe('normal text');
  });
});
