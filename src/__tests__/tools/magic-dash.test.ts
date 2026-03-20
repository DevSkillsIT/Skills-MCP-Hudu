import { jest, describe, test, expect } from '@jest/globals';
import { executeMagicDashTool, executeMagicDashQueryTool } from '../../tools/magic-dash.js';
import type { HuduClient } from '../../hudu-client.js';

const MOCK_DASH = {
  id: 3,
  title: 'Status Backup',
  company_name: 'SKILLS IT',
  content: 'Backup concluido',
  shade: 'success',
  created_at: '2025-01-01',
  updated_at: '2026-03-01',
};

const createMockClient = (overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}) =>
  ({
    createMagicDash: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_DASH),
    getMagicDash: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_DASH),
    updateMagicDash: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_DASH),
    deleteMagicDash: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
    getMagicDashes: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    ...overrides,
  } as unknown as HuduClient);

describe('executeMagicDashTool (CRUD)', () => {
  describe('create action', () => {
    test('creates magic dash with title and company_name', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool(
        { action: 'create', fields: { title: 'Status Backup', company_name: 'SKILLS IT' } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.createMagicDash).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Status Backup', company_name: 'SKILLS IT' })
      );
    });

    test('returns error when title is missing', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool(
        { action: 'create', fields: { company_name: 'SKILLS IT' } },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.createMagicDash).not.toHaveBeenCalled();
    });

    test('returns error when company_name is missing', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool(
        { action: 'create', fields: { title: 'Status Backup' } },
        client
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.createMagicDash).not.toHaveBeenCalled();
    });

    test('returns error when fields is missing entirely', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool({ action: 'create' }, client);
      expect(result.success).toBe(false);
      expect(client.createMagicDash).not.toHaveBeenCalled();
    });

    test('creates with optional fields when provided', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool(
        {
          action: 'create',
          fields: {
            title: 'Status Backup',
            company_name: 'SKILLS IT',
            shade: 'success',
            content: 'All good',
          },
        },
        client
      );
      expect(result.success).toBe(true);
      expect(client.createMagicDash).toHaveBeenCalledWith(
        expect.objectContaining({ shade: 'success', content: 'All good' })
      );
    });
  });

  describe('get action', () => {
    test('gets magic dash by id', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool({ action: 'get', id: 3 }, client);
      expect(result.success).toBe(true);
      expect(client.getMagicDash).toHaveBeenCalledWith(3);
    });

    test('returns error when id is missing for get', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool({ action: 'get' }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(client.getMagicDash).not.toHaveBeenCalled();
    });
  });

  describe('update action', () => {
    test('updates magic dash by id', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool(
        { action: 'update', id: 3, fields: { shade: 'danger', content: 'Backup failed' } },
        client
      );
      expect(result.success).toBe(true);
      expect(client.updateMagicDash).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ shade: 'danger', content: 'Backup failed' })
      );
    });

    test('returns error when id is missing for update', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool(
        { action: 'update', fields: { shade: 'danger' } },
        client
      );
      expect(result.success).toBe(false);
      expect(client.updateMagicDash).not.toHaveBeenCalled();
    });
  });

  describe('delete action', () => {
    test('deletes magic dash by id', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool({ action: 'delete', id: 3 }, client);
      expect(result.success).toBe(true);
      expect(client.deleteMagicDash).toHaveBeenCalledWith(3);
    });

    test('returns error when id is missing for delete', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool({ action: 'delete' }, client);
      expect(result.success).toBe(false);
      expect(client.deleteMagicDash).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('returns success false on API error', async () => {
      const client = createMockClient({
        getMagicDash: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Not found')),
      });
      const result = await executeMagicDashTool({ action: 'get', id: 999 }, client);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns error for unknown action', async () => {
      const client = createMockClient();
      const result = await executeMagicDashTool({ action: 'invalid' }, client);
      expect(result.success).toBe(false);
    });
  });
});

describe('executeMagicDashQueryTool (Query)', () => {
  test('calls getMagicDashes and returns success', async () => {
    const client = createMockClient({
      getMagicDashes: jest.fn<() => Promise<any>>().mockResolvedValue([MOCK_DASH]),
    });
    const result = await executeMagicDashQueryTool({}, client);
    expect(result.success).toBe(true);
    expect(client.getMagicDashes).toHaveBeenCalled();
  });

  test('passes company_id filter to getMagicDashes', async () => {
    const client = createMockClient();
    await executeMagicDashQueryTool({ company_id: 42 }, client);
    expect(client.getMagicDashes).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: 42 })
    );
  });

  test('returns success false on API error', async () => {
    const client = createMockClient({
      getMagicDashes: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Server error')),
    });
    const result = await executeMagicDashQueryTool({}, client);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
