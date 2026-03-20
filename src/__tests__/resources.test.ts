import { jest, describe, test, expect } from '@jest/globals';
import { InvalidResourceUriError, listResources, readResource } from '../resources.js';
import type { HuduClient } from '../hudu-client.js';

const createMockClient = (overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}) =>
  ({
    getCompanies: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    getCompany: jest.fn<() => Promise<any>>().mockResolvedValue({}),
    getAssets: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    getAsset: jest.fn<() => Promise<any>>().mockResolvedValue({}),
    getArticles: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    getArticle: jest.fn<() => Promise<any>>().mockResolvedValue({}),
    ...overrides,
  } as unknown as HuduClient);

describe('listResources', () => {
  test('returns at least 6 resources', () => {
    const resources = listResources();
    expect(resources.length).toBeGreaterThanOrEqual(6);
  });

  test('all URIs start with hudu://', () => {
    const resources = listResources();
    for (const r of resources) {
      expect(r.uri).toMatch(/^hudu:\/\//);
    }
  });

  test('all resources have mimeType text/markdown', () => {
    const resources = listResources();
    for (const r of resources) {
      expect(r.mimeType).toBe('text/markdown');
    }
  });

  test('all resources have a name and description', () => {
    const resources = listResources();
    for (const r of resources) {
      expect(r.name).toBeDefined();
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.description).toBeDefined();
      expect(r.description.length).toBeGreaterThan(0);
    }
  });

  test('includes companies, assets, and articles URIs', () => {
    const resources = listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain('hudu://companies');
    expect(uris).toContain('hudu://assets');
    expect(uris).toContain('hudu://articles');
  });
});

describe('readResource', () => {
  describe('companies resource', () => {
    test('reads companies list', async () => {
      const client = createMockClient({
        getCompanies: jest.fn<() => Promise<any>>().mockResolvedValue([
          { id: 1, name: 'Test Company', company_type: 'MSP', city: 'Sao Paulo', state: 'SP', archived: false },
        ]),
      });
      const result = await readResource('hudu://companies', client);
      expect(result.mimeType).toBe('text/markdown');
      expect(result.text).toContain('Test Company');
    });

    test('reads company by id', async () => {
      const client = createMockClient({
        getCompany: jest.fn<() => Promise<any>>().mockResolvedValue({
          id: 42,
          name: 'SKILLS IT',
          company_type: 'MSP',
          city: 'Sao Paulo',
          state: 'SP',
          archived: false,
        }),
      });
      const result = await readResource('hudu://companies/42', client);
      expect(result.mimeType).toBe('text/markdown');
      expect(client.getCompany).toHaveBeenCalledWith(42);
      expect(result.text).toContain('SKILLS IT');
    });

    test('returns correct uri in response', async () => {
      const client = createMockClient();
      const result = await readResource('hudu://companies', client);
      expect(result.uri).toBe('hudu://companies');
    });
  });

  describe('assets resource', () => {
    test('reads assets list', async () => {
      const client = createMockClient({
        getAssets: jest.fn<() => Promise<any>>().mockResolvedValue([
          { id: 5, name: 'Server-01', asset_layout_id: 1, company_id: 42, archived: false },
        ]),
      });
      const result = await readResource('hudu://assets', client);
      expect(result.mimeType).toBe('text/markdown');
      expect(client.getAssets).toHaveBeenCalled();
    });

    test('reads asset by id', async () => {
      const client = createMockClient({
        getAsset: jest.fn<() => Promise<any>>().mockResolvedValue({
          id: 5,
          name: 'Server-01',
          asset_layout_id: 1,
          company_id: 42,
          archived: false,
          fields: [],
        }),
      });
      const result = await readResource('hudu://assets/5', client);
      expect(client.getAsset).toHaveBeenCalledWith(5);
      expect(result.mimeType).toBe('text/markdown');
    });
  });

  describe('articles resource', () => {
    test('reads articles list', async () => {
      const client = createMockClient({
        getArticles: jest.fn<() => Promise<any>>().mockResolvedValue([
          { id: 10, name: 'VPN Setup Guide', content: '<p>How to setup VPN</p>', company_id: null },
        ]),
      });
      const result = await readResource('hudu://articles', client);
      expect(result.mimeType).toBe('text/markdown');
      expect(client.getArticles).toHaveBeenCalled();
    });

    test('reads article by id', async () => {
      const client = createMockClient({
        getArticle: jest.fn<() => Promise<any>>().mockResolvedValue({
          id: 10,
          name: 'VPN Setup Guide',
          content: '<p>How to setup VPN</p>',
          company_id: null,
        }),
      });
      const result = await readResource('hudu://articles/10', client);
      expect(client.getArticle).toHaveBeenCalledWith(10);
      expect(result.mimeType).toBe('text/markdown');
    });
  });

  describe('error cases', () => {
    test('throws on invalid URI pattern', async () => {
      const client = createMockClient();
      await expect(readResource('hudu://invalid', client)).rejects.toThrow();
    });

    test('throws on non-hudu URI', async () => {
      const client = createMockClient();
      await expect(readResource('invalid-format', client)).rejects.toThrow();
    });

    test('throws on http URI instead of hudu://', async () => {
      const client = createMockClient();
      await expect(readResource('http://companies', client)).rejects.toThrow();
    });

    test('error contains message when URI is invalid', async () => {
      const client = createMockClient();
      let caughtError: Error | undefined;
      try {
        await readResource('hudu://unknown-type', client);
      } catch (err: unknown) {
        caughtError = err as Error;
      }
      expect(caughtError).toBeDefined();
      expect(caughtError?.message).toBeDefined();
    });

    test('throws InvalidResourceUriError for invalid URI', async () => {
      const client = createMockClient();
      try {
        await readResource('hudu://passwords', client);
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: unknown) {
        expect((err as Error).name).toBe('InvalidResourceUriError');
        expect(err).toBeInstanceOf(InvalidResourceUriError);
      }
    });

    test('InvalidResourceUriError message lists valid patterns', async () => {
      const client = createMockClient();
      try {
        await readResource('hudu://nonexistent', client);
        expect(true).toBe(false);
      } catch (err: unknown) {
        const msg = (err as Error).message;
        expect(msg).toContain('hudu://companies');
        expect(msg).toContain('hudu://assets');
        expect(msg).toContain('hudu://articles');
      }
    });

    test('throws InvalidResourceUriError for non-numeric ID', async () => {
      const client = createMockClient();
      await expect(readResource('hudu://companies/abc', client)).rejects.toThrow(InvalidResourceUriError);
    });
  });
});
