import { jest, describe, test, expect } from '@jest/globals';
import { executeRelationsTool, executeRelationsQueryTool } from '../../tools/relations.js';
import type { HuduClient } from '../../hudu-client.js';

const MOCK_RELATION = {
  id: 7,
  name: 'Server -> Firewall',
  fromable_type: 'Asset',
  fromable_id: 100,
  toable_type: 'Asset',
  toable_id: 200,
  created_at: '2025-06-01',
  updated_at: '2025-06-01',
};

const createMockClient = (overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}) =>
  ({
    createRelation: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_RELATION),
    getRelation: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_RELATION),
    updateRelation: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_RELATION),
    deleteRelation: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
    getRelations: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    ...overrides,
  } as unknown as HuduClient);

describe('executeRelationsTool (CRUD)', () => {
  describe('create action', () => {
    test('creates relation with all required fields', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        {
          action: 'create',
          fields: {
            fromable_type: 'Asset',
            fromable_id: 100,
            toable_type: 'Asset',
            toable_id: 200,
          },
        },
        client
      );
      expect(result.success).toBe(true);
      expect(client.createRelation).toHaveBeenCalledWith(
        expect.objectContaining({
          fromable_type: 'Asset',
          fromable_id: 100,
          toable_type: 'Asset',
          toable_id: 200,
        })
      );
    });

    test('returns error when fromable_type is missing', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        { action: 'create', fields: { fromable_id: 100, toable_type: 'Asset', toable_id: 200 } },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.createRelation).not.toHaveBeenCalled();
    });

    test('returns error when fromable_id is missing', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        { action: 'create', fields: { fromable_type: 'Asset', toable_type: 'Asset', toable_id: 200 } },
        client
      );
      expect(result.success).toBe(false);
      expect(client.createRelation).not.toHaveBeenCalled();
    });

    test('returns error when toable_type is missing', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        { action: 'create', fields: { fromable_type: 'Asset', fromable_id: 100, toable_id: 200 } },
        client
      );
      expect(result.success).toBe(false);
      expect(client.createRelation).not.toHaveBeenCalled();
    });

    test('returns error when toable_id is missing', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        { action: 'create', fields: { fromable_type: 'Asset', fromable_id: 100, toable_type: 'Asset' } },
        client
      );
      expect(result.success).toBe(false);
      expect(client.createRelation).not.toHaveBeenCalled();
    });

    test('returns error when fields is missing entirely', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool({ action: 'create' }, client);
      expect(result.success).toBe(false);
      expect(client.createRelation).not.toHaveBeenCalled();
    });
  });

  describe('get action', () => {
    test('gets relation by id', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool({ action: 'get', id: 7 }, client);
      expect(result.success).toBe(true);
      expect(client.getRelation).toHaveBeenCalledWith(7);
    });

    test('returns error when id is missing for get', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool({ action: 'get' }, client);
      expect(result.success).toBe(false);
      expect(client.getRelation).not.toHaveBeenCalled();
    });
  });

  describe('update action', () => {
    test('updates relation by id', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        { action: 'update', id: 7, fields: { name: 'Updated relation' } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.updateRelation).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ name: 'Updated relation' })
      );
    });

    test('returns error when id is missing for update', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool(
        { action: 'update', fields: { name: 'Test' } },
        client
      );
      expect(result.success).toBe(false);
      expect(client.updateRelation).not.toHaveBeenCalled();
    });
  });

  describe('delete action', () => {
    test('deletes relation by id', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool({ action: 'delete', id: 7 }, client);
      expect(result.success).toBe(true);
      expect(client.deleteRelation).toHaveBeenCalledWith(7);
    });

    test('returns error when id is missing for delete', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool({ action: 'delete' }, client);
      expect(result.success).toBe(false);
      expect(client.deleteRelation).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('returns success false on API error', async () => {
      const client = createMockClient({
        createRelation: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('API 500')),
      });
      const result = await executeRelationsTool(
        {
          action: 'create',
          fields: { fromable_type: 'Asset', fromable_id: 1, toable_type: 'Asset', toable_id: 2 },
        },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns error for unknown action', async () => {
      const client = createMockClient();
      const result = await executeRelationsTool({ action: 'unknown' }, client);
      expect(result.success).toBe(false);
    });
  });
});

describe('executeRelationsQueryTool (Query)', () => {
  test('calls getRelations and returns success', async () => {
    const client = createMockClient({
      getRelations: jest.fn<() => Promise<any>>().mockResolvedValue([MOCK_RELATION]),
    });
    const result = await executeRelationsQueryTool({}, client);
    expect(result.success).toBe(true);
    expect(client.getRelations).toHaveBeenCalled();
  });

  test('passes fromable filters to getRelations', async () => {
    const client = createMockClient();
    await executeRelationsQueryTool({ fromable_type: 'Asset', fromable_id: 100 }, client);
    expect(client.getRelations).toHaveBeenCalledWith(
      expect.objectContaining({ fromable_type: 'Asset', fromable_id: 100 })
    );
  });

  test('passes toable filters to getRelations', async () => {
    const client = createMockClient();
    await executeRelationsQueryTool({ toable_type: 'Company', toable_id: 42 }, client);
    expect(client.getRelations).toHaveBeenCalledWith(
      expect.objectContaining({ toable_type: 'Company', toable_id: 42 })
    );
  });

  test('returns success false on API error', async () => {
    const client = createMockClient({
      getRelations: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Network error')),
    });
    const result = await executeRelationsQueryTool({}, client);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
