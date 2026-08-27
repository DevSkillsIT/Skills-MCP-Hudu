/**
 * BUG-15 — "sem mais resultados" became a lie when page_size rose
 *
 * `toPagedResponse` infers `hasMore` from `records.length >= pageSize`. That
 * only holds while the server returns what was asked for. With the cap at 25
 * it coincided with the API's own page ceiling and happened to be right.
 * Raising the cap to 1000 broke the coincidence:
 *
 *   pediu 100, API devolveu 25  ->  "Página 1, sem mais resultados"   (FALSO)
 *
 * `/asset_layouts` silently ceilings at 25 — documented in this repo as
 * PRB-03 — so any caller raising page_size on it was told the instance held
 * 25 records.
 *
 * The honest position when fewer rows come back than were asked for is that we
 * cannot tell the end of the set from a server-side cap. A round number is the
 * signal for a cap; an arbitrary one is a genuine end.
 */

import { toPagedResponse, formatArticleList } from '../formatters/markdown.js';

import type { HuduArticle } from '../types.js';

const rows = (n: number): HuduArticle[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `A${i}`,
    content: '',
    enable_sharing: false,
    archived: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  })) as HuduArticle[];

describe('BUG-15 — pagination tells the truth about what it knows', () => {
  it('claims more pages when the page came back full', () => {
    const md = formatArticleList(toPagedResponse(rows(25), 1, 25));
    expect(md).toContain('mais disponíveis');
  });

  it('does NOT claim the set ended when the server may have capped the page', () => {
    // The regression: 25 rows back from a request for 100.
    const md = formatArticleList(toPagedResponse(rows(25), 1, 100));
    expect(md).not.toContain('sem mais resultados');
    expect(md).toMatch(/limitou a página|pode ter/i);
  });

  it('flags the same for the other common ceilings', () => {
    for (const [got, asked] of [[100, 1000], [50, 200], [500, 1000]] as const) {
      const md = formatArticleList(toPagedResponse(rows(got), 1, asked));
      expect(md).not.toContain('sem mais resultados');
    }
  });

  it('still reports a genuine end when the count is arbitrary', () => {
    // 12 of a requested 100 is the set ending, not a cap.
    const md = formatArticleList(toPagedResponse(rows(12), 1, 100));
    expect(md).toContain('sem mais resultados');
  });

  it('reports an empty page as the end, never as a suspected cap', () => {
    const md = formatArticleList(toPagedResponse([], 1, 1000));
    expect(md).toMatch(/Nenhum artigo/);
  });

  it('a known total settles the question and overrides the guess', () => {
    const md = formatArticleList(toPagedResponse(rows(25), 1, 100, 25));
    expect(md).toContain('sem mais resultados');
    expect(md).toContain('Total: 25');
    expect(md).not.toMatch(/limitou a página/i);
  });

  it('a known total also proves there IS more', () => {
    const md = formatArticleList(toPagedResponse(rows(25), 1, 100, 900));
    expect(md).toContain('mais disponíveis');
  });
});
