/**
 * PRB-03: Asset layout templates page_size cap (REQ-14)
 *
 * Tests:
 * - search_asset_layout_templates tool schema includes page_size with maximum: 100
 * - manage tool schema is not affected
 */

import { assetLayoutsQueryTool, assetLayoutsTool } from '../tools/asset-layouts.js';

describe('PRB-03: asset_layout_templates page_size cap', () => {
  test('search_asset_layout_templates schema includes page_size property', () => {
    const schema = assetLayoutsQueryTool.inputSchema as any;
    expect(schema.properties).toHaveProperty('page_size');
  });

  test('search_asset_layout_templates page_size has maximum of 100', () => {
    const schema = assetLayoutsQueryTool.inputSchema as any;
    expect(schema.properties.page_size.maximum).toBe(100);
  });

  test('search_asset_layout_templates page_size is type number', () => {
    const schema = assetLayoutsQueryTool.inputSchema as any;
    expect(schema.properties.page_size.type).toBe('number');
  });

  test('manage_asset_layout_templates tool is not affected', () => {
    // Manage tool has no page_size constraint
    const schema = assetLayoutsTool.inputSchema as any;
    // Manage tool should not have page_size in top-level properties
    expect(schema.properties).not.toHaveProperty('page_size');
  });
});
