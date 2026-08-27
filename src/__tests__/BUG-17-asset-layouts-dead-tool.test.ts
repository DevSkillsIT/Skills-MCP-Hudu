/**
 * BUG-17 — hudu_search_asset_layout_templates crashed on every call
 *
 * Pre-existing, found by live revalidation (2026-08-27), not by the diff.
 * Confirmed against HEAD: the executor has always wrapped a saturated result:
 *
 *   if (Array.isArray(layouts) && layouts.length >= 25) {
 *     return createSuccessResponse({ records: layouts, page_size_capped: 25 });
 *   }
 *
 * The formatter then does `toPagedResponse(data, ...)`, which puts that OBJECT
 * where an array belongs, and `formatAssetLayoutList` calls `.map()` on it:
 *
 *   ERRO JSON-RPC: paged.records.map is not a function
 *
 * Any instance holding 25 or more asset layouts got that for every call,
 * including the default one with no arguments. The instance under test holds
 * exactly 25, so the tool was dead there.
 *
 * The cap is real and worth signalling — it just needed the response `warning`
 * channel rather than a shape the formatter cannot read.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { executeAssetLayoutsQueryTool } from '../tools/asset-layouts.js';
import { formatToolResponse } from '../formatters/response-formatter.js';

const layout = (id: number) => ({
  id,
  name: `Layout ${id}`,
  icon: 'fas fa-server',
  color: '#fff',
  icon_color: '#000',
  active: true,
  include_passwords: false,
  include_photos: false,
  include_comments: false,
  include_files: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  fields: [],
});

const clientWith = (n: number) => ({ getAssetLayouts: async () => Array.from({ length: n }, (_, i) => layout(i + 1)) }) as any;

describe('BUG-17 — a saturated page still renders', () => {
  it('returns an array, not a wrapper object, when the cap is hit', async () => {
    const res = await executeAssetLayoutsQueryTool({}, clientWith(25));
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(25);
  });

  it('renders the table instead of throwing', () => {
    // The exact crash: an object where the formatter expects a list.
    const md = formatToolResponse('hudu_search_asset_layout_templates', Array.from({ length: 25 }, (_, i) => layout(i + 1)), {});
    expect(md).toContain('| ID |');
    expect(md).toContain('Layout 1');
  });

  it('still tells the caller the page was capped — via warning, not shape', async () => {
    const res = await executeAssetLayoutsQueryTool({}, clientWith(25));
    expect(res.warning).toMatch(/25/);
    expect(res.warning).toMatch(/limit|cap|página/i);
  });

  it('says nothing when the page is not saturated', async () => {
    const res = await executeAssetLayoutsQueryTool({}, clientWith(7));
    expect(res.warning).toBeUndefined();
    expect(res.data).toHaveLength(7);
  });

  it('survives a non-array payload from the client without crashing', () => {
    const md = formatToolResponse('hudu_search_asset_layout_templates', { records: [layout(1)] } as any, {});
    expect(md).not.toMatch(/is not a function/);
  });
});

/**
 * The warning channel only helps if EVERY response path renders it. It was
 * added to the SDK handler first, and the Streamable HTTP path — the one this
 * deployment actually serves — kept dropping it, so the caveat existed in code
 * and never reached a caller. This guards the next path someone adds.
 */
describe('BUG-17 — every response path carries the warning', () => {
  it('each formatToolResponse call site prepends result.warning', () => {
    const src = readFileSync(join(process.cwd(), 'src/server.ts'), 'utf8');
    const sites = src.split('formatToolResponse(name').length - 1;
    expect(sites).toBeGreaterThan(0);

    // Each site must have a `.warning ?` guard within the surrounding block.
    const guards = src.split(/\.warning \?/).length - 1;
    expect(guards).toBe(sites);
  });
});
