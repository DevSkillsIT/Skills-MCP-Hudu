import { jest, describe, test, expect } from '@jest/globals';
import { executeAssetLayoutsTool, executeAssetLayoutsQueryTool } from '../../tools/asset-layouts.js';
import type { HuduClient } from '../../hudu-client.js';

const MOCK_LAYOUT = {
  id: 5,
  name: 'Servidor',
  icon: 'fas fa-server',
  color: '#2196F3',
  active: true,
  fields: [
    { id: 1, label: 'Hostname', field_type: 'Text', required: true, show_in_list: true, position: 1 },
  ],
};

const createMockClient = (overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}) =>
  ({
    createAssetLayout: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_LAYOUT),
    getAssetLayout: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_LAYOUT),
    updateAssetLayout: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_LAYOUT),
    getAssetLayouts: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    ...overrides,
  } as unknown as HuduClient);

describe('executeAssetLayoutsTool (CRUD)', () => {
  describe('create action', () => {
    test('creates asset layout with valid name', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool(
        { action: 'create', fields: { name: 'Servidor' } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.createAssetLayout).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Servidor' })
      );
    });

    test('returns error when name is missing', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool(
        { action: 'create', fields: { icon: 'fas fa-server' } },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.createAssetLayout).not.toHaveBeenCalled();
    });

    test('returns error when fields is missing entirely', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool({ action: 'create' }, client);
      expect(result.success).toBe(false);
      expect(client.createAssetLayout).not.toHaveBeenCalled();
    });
  });

  describe('get action', () => {
    test('gets asset layout by id', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool({ action: 'get', id: 5 }, client);
      expect(result.success).toBe(true);
      expect(client.getAssetLayout).toHaveBeenCalledWith(5);
    });

    test('returns error when id is missing for get', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool({ action: 'get' }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.getAssetLayout).not.toHaveBeenCalled();
    });
  });

  describe('update action', () => {
    test('updates asset layout by id', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool(
        { action: 'update', id: 5, fields: { active: false } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.updateAssetLayout).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ active: false })
      );
    });

    test('returns error when id is missing for update', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool(
        { action: 'update', fields: { active: false } },
        client
      );
      expect(result.success).toBe(false);
      expect(client.updateAssetLayout).not.toHaveBeenCalled();
    });
  });

  describe('delete action', () => {
    test('returns error because delete is not supported', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool({ action: 'delete', id: 5 }, client);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('error handling', () => {
    test('returns success false on API error', async () => {
      const client = createMockClient({
        getAssetLayout: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('API 404')),
      });
      const result = await executeAssetLayoutsTool({ action: 'get', id: 99 }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns error for unknown action', async () => {
      const client = createMockClient();
      const result = await executeAssetLayoutsTool({ action: 'archive' }, client);
      expect(result.success).toBe(false);
    });
  });
});

describe('executeAssetLayoutsQueryTool (Query)', () => {
  test('calls getAssetLayouts and returns success', async () => {
    const client = createMockClient({
      getAssetLayouts: jest.fn<() => Promise<any>>().mockResolvedValue([MOCK_LAYOUT]),
    });
    const result = await executeAssetLayoutsQueryTool({}, client);
    expect(result.success).toBe(true);
    expect(client.getAssetLayouts).toHaveBeenCalled();
  });

  test('passes filters to getAssetLayouts', async () => {
    const client = createMockClient();
    await executeAssetLayoutsQueryTool({ search: 'Servidor', page: 1 }, client);
    expect(client.getAssetLayouts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Servidor', page: 1 })
    );
  });

  test('returns success false on API error', async () => {
    const client = createMockClient({
      getAssetLayouts: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Server error')),
    });
    const result = await executeAssetLayoutsQueryTool({}, client);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
