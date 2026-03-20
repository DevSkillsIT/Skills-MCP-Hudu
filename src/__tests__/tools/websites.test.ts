import { jest, describe, test, expect } from '@jest/globals';
import { executeWebsitesTool, executeWebsitesQueryTool } from '../../tools/websites.js';
import type { HuduClient } from '../../hudu-client.js';

const MOCK_WEBSITE = {
  id: 10,
  name: 'SKILLS IT Site',
  url: 'https://skillsit.com.br',
  company_id: 42,
  paused: false,
  created_at: '2025-01-01',
  updated_at: '2025-06-01',
};

const fn = <T = any>(value?: T) =>
  jest.fn<() => Promise<T | undefined>>().mockResolvedValue(value);

const createMockClient = (overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}) =>
  ({
    createWebsite: fn(MOCK_WEBSITE),
    getWebsite: fn(MOCK_WEBSITE),
    updateWebsite: fn(MOCK_WEBSITE),
    deleteWebsite: fn(undefined),
    getWebsites: fn([] as typeof MOCK_WEBSITE[]),
    ...overrides,
  } as unknown as HuduClient);

describe('executeWebsitesTool (CRUD)', () => {
  describe('create action', () => {
    test('creates website with valid name and url', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool(
        { action: 'create', fields: { name: 'SKILLS IT Site', url: 'https://skillsit.com.br' } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.createWebsite).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SKILLS IT Site', url: 'https://skillsit.com.br' })
      );
    });

    test('returns error when name is missing', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool(
        { action: 'create', fields: { url: 'https://skillsit.com.br' } },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.createWebsite).not.toHaveBeenCalled();
    });

    test('returns error when url is missing', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool(
        { action: 'create', fields: { name: 'SKILLS IT Site' } },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.createWebsite).not.toHaveBeenCalled();
    });

    test('returns error when fields is missing entirely', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'create' }, client);
      expect(result.success).toBe(false);
      expect(client.createWebsite).not.toHaveBeenCalled();
    });
  });

  describe('get action', () => {
    test('gets website by id', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'get', id: 10 }, client);
      expect(result.success).toBe(true);
      expect(client.getWebsite).toHaveBeenCalledWith(10);
    });

    test('returns error when id is missing', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'get' }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.getWebsite).not.toHaveBeenCalled();
    });
  });

  describe('update action', () => {
    test('updates website by id', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool(
        { action: 'update', id: 10, fields: { paused: true } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.updateWebsite).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ paused: true })
      );
    });

    test('returns error when id is missing for update', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'update', fields: { paused: true } }, client);
      expect(result.success).toBe(false);
      expect(client.updateWebsite).not.toHaveBeenCalled();
    });
  });

  describe('delete action', () => {
    test('deletes website by id', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'delete', id: 10 }, client);
      expect(result.success).toBe(true);
      expect(client.deleteWebsite).toHaveBeenCalledWith(10);
    });

    test('returns error when id is missing for delete', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'delete' }, client);
      expect(result.success).toBe(false);
      expect(client.deleteWebsite).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('returns success false on API error', async () => {
      const client = createMockClient({
        getWebsite: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('API error')),
      });
      const result = await executeWebsitesTool({ action: 'get', id: 10 }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns error for unknown action', async () => {
      const client = createMockClient();
      const result = await executeWebsitesTool({ action: 'invalid' }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('executeWebsitesQueryTool (Query)', () => {
  test('calls getWebsites and returns success', async () => {
    const client = createMockClient({
      getWebsites: jest.fn<() => Promise<any>>().mockResolvedValue([MOCK_WEBSITE]),
    });
    const result = await executeWebsitesQueryTool({}, client);
    expect(result.success).toBe(true);
    expect(client.getWebsites).toHaveBeenCalled();
  });

  test('passes filters to getWebsites', async () => {
    const client = createMockClient();
    await executeWebsitesQueryTool({ company_id: 42, page: 1 }, client);
    expect(client.getWebsites).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: 42, page: 1 })
    );
  });

  test('returns success false on API error', async () => {
    const client = createMockClient({
      getWebsites: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Network error')),
    });
    const result = await executeWebsitesQueryTool({}, client);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
