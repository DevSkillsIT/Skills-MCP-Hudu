/**
 * BUG-04: Global typed search — type-specific results not formatted correctly
 *
 * Investigation finding: The SPEC hypothesis (R-11) that Hudu uses `query`
 * instead of `search` for some endpoints was NOT confirmed. OpenAPI spec shows
 * all four endpoints (/assets, /articles, /companies, /asset_passwords) accept
 * the `search` query parameter. The HuduClient methods (getAssets, getArticles,
 * getCompanies, getAssetPasswords) all use { search: query } correctly.
 *
 * Real bug found: When `type` is specified in hudu_search_all_resource_types
 * (e.g., type='assets'), the tool returns an ARRAY of results directly.
 * However, formatGlobalSearchResults() in the response formatter expects an
 * OBJECT with keys { articles, assets, passwords, companies }. When data is
 * an array, data.articles === undefined, so the formatter returns
 * "Nenhum resultado encontrado" even when results exist.
 *
 * This test characterizes the correct behavior:
 * 1. Without `type`: results are { articles, assets, passwords, companies }
 * 2. With `type`: results are an array, but formatter receives them wrapped
 *    in the correct key (e.g. { assets: [...] }) so formatGlobalSearchResults
 *    can render them properly.
 *
 * Fix target: executeSearchTool in src/tools/search.ts — when type is specified,
 * wrap the result array in the appropriate key object before returning.
 *
 * FAILURE EVIDENCE (pre-fix run):
 *   When type='assets' and results=[{id:1,name:'firewall'}]:
 *   Expected: formatter receives { assets: [{id:1,name:'firewall'}] }
 *   Received: formatter receives [{id:1,name:'firewall'}] (raw array, articles=undefined)
 *
 * REQ: REQ-04 / SPEC-HUDU-FIX-001
 */

import { jest, describe, test, expect } from '@jest/globals';
import { executeSearchTool } from '../tools/search.js';
import type { HuduClient } from '../hudu-client.js';

// Mock factory — returns controlled data for each resource type
const fn = <T = any>(value?: T) =>
  jest.fn<() => Promise<T | undefined>>().mockResolvedValue(value);

const MOCK_ARTICLE = { id: 1, name: 'Firewall Config', company_id: 1, updated_at: '2026-01-01' };
const MOCK_ASSET = { id: 2, name: 'Firewall-01', asset_type: 'Network', company_id: 1 };
const MOCK_PASSWORD = { id: 3, name: 'Firewall Admin', username: 'admin', company_id: 1 };
const MOCK_COMPANY = { id: 4, name: 'SKILLS IT', city: 'Cascavel', state: 'PR' };

const createMockClient = (overrides: Record<string, any> = {}) =>
  ({
    getArticles: fn([MOCK_ARTICLE]),
    getAssets: fn([MOCK_ASSET]),
    getAssetPasswords: fn([MOCK_PASSWORD]),
    getCompanies: fn([MOCK_COMPANY]),
    ...overrides,
  } as unknown as HuduClient);

describe('BUG-04: hudu_search_all_resource_types — typed search result shape', () => {
  describe('Without type (search all): result must be object with resource keys', () => {
    test('search all returns object with articles, assets, passwords, companies keys', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'firewall', page_size: 5 }, client);
      expect(result.success).toBe(true);
      const data = result.data as any;
      // Must be an object (not array) with resource keys
      expect(Array.isArray(data)).toBe(false);
      expect(data).toHaveProperty('articles');
      expect(data).toHaveProperty('assets');
      expect(data).toHaveProperty('passwords');
      expect(data).toHaveProperty('companies');
    });

    test('search all articles key contains expected data', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'firewall', page_size: 5 }, client);
      const data = result.data as any;
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].name).toBe('Firewall Config');
    });
  });

  describe('With type="assets": result must be wrapped in assets key for formatter', () => {
    test('type=assets result is wrapped as { assets: [...] } not raw array', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'firewall', type: 'assets', page_size: 5 }, client);
      expect(result.success).toBe(true);
      const data = result.data as any;
      // After fix: should be { assets: [...] } so formatter can render it
      expect(Array.isArray(data)).toBe(false);
      expect(data).toHaveProperty('assets');
      expect(data.assets).toHaveLength(1);
      expect(data.assets[0].name).toBe('Firewall-01');
    });

    test('type=assets calls getAssets with correct search param', async () => {
      const client = createMockClient();
      await executeSearchTool({ query: 'firewall', type: 'assets', page_size: 5 }, client);
      expect(client.getAssets).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'firewall' })
      );
    });
  });

  describe('With type="articles": result must be wrapped in articles key', () => {
    test('type=articles result is wrapped as { articles: [...] }', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'policy', type: 'articles', page_size: 5 }, client);
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(Array.isArray(data)).toBe(false);
      expect(data).toHaveProperty('articles');
      expect(data.articles).toHaveLength(1);
    });

    test('type=articles calls getArticles with search param (not query param)', async () => {
      const client = createMockClient();
      await executeSearchTool({ query: 'policy', type: 'articles', page_size: 5 }, client);
      expect(client.getArticles).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'policy' })
      );
      // Confirm it does NOT pass a 'query' param (the SPEC R-11 hypothesis — confirmed false)
      const callArgs = (client.getArticles as any).mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('query');
    });
  });

  describe('With type="passwords": result must be wrapped in passwords key', () => {
    test('type=passwords result is wrapped as { passwords: [...] }', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'admin', type: 'passwords', page_size: 5 }, client);
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(Array.isArray(data)).toBe(false);
      expect(data).toHaveProperty('passwords');
    });
  });

  describe('With type="companies": result must be wrapped in companies key', () => {
    test('type=companies result is wrapped as { companies: [...] }', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'skills', type: 'companies', page_size: 5 }, client);
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(Array.isArray(data)).toBe(false);
      expect(data).toHaveProperty('companies');
    });
  });

  describe('Error handling', () => {
    test('empty query returns error', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: '', page_size: 5 }, client);
      expect(result.success).toBe(false);
    });

    test('unsupported type returns error', async () => {
      const client = createMockClient();
      const result = await executeSearchTool({ query: 'test', type: 'unknown_type', page_size: 5 }, client);
      expect(result.success).toBe(false);
    });

    test('password values are masked in results (no-type search all)', async () => {
      const clientWithPasswords = createMockClient({
        getAssetPasswords: fn([{ id: 5, name: 'Admin', password: 'secret123', username: 'admin', company_id: 1 }])
      });
      // Search all types (no type filter) — passwords returned in { passwords: [...] }
      const result = await executeSearchTool({ query: 'admin', page_size: 5 }, clientWithPasswords);
      expect(result.success).toBe(true);
      const data = result.data as any;
      // Password must be masked in global search context
      expect(JSON.stringify(data)).not.toContain('secret123');
      expect(data.passwords).toHaveLength(1);
      expect(data.passwords[0].password).toBe('****');
    });
  });
});
