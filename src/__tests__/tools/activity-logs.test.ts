import { jest, describe, test, expect } from '@jest/globals';
import { executeActivityLogsTool } from '../../tools/activity-logs.js';
import type { HuduClient } from '../../hudu-client.js';

const MOCK_LOGS = [
  {
    id: 100,
    user_email: 'admin@skillsit.com.br',
    resource_type: 'Company',
    action_message: 'updated',
    created_at: '2026-03-20T10:30:00Z',
  },
  {
    id: 101,
    user_email: 'tech@skillsit.com.br',
    resource_type: 'Asset',
    action_message: 'created',
    created_at: '2026-03-20T11:00:00Z',
  },
];

const createMockClient = (overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}) =>
  ({
    getActivityLogs: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    ...overrides,
  } as unknown as HuduClient);

describe('executeActivityLogsTool', () => {
  test('calls getActivityLogs with no filters and returns success', async () => {
    const client = createMockClient({
      getActivityLogs: jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_LOGS),
    });
    const result = await executeActivityLogsTool({}, client);
    expect(result.success).toBe(true);
    expect(client.getActivityLogs).toHaveBeenCalledWith({});
    expect(result.data).toBeDefined();
  });

  test('passes user_email filter to client', async () => {
    const client = createMockClient();
    await executeActivityLogsTool({ user_email: 'admin@skillsit.com.br' }, client);
    expect(client.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ user_email: 'admin@skillsit.com.br' })
    );
  });

  test('passes resource_type filter to client', async () => {
    const client = createMockClient();
    await executeActivityLogsTool({ resource_type: 'Company' }, client);
    expect(client.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ resource_type: 'Company' })
    );
  });

  test('passes combined filters to client', async () => {
    const client = createMockClient();
    await executeActivityLogsTool(
      { user_email: 'admin@skillsit.com.br', resource_type: 'Asset', page: 2 },
      client
    );
    expect(client.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        user_email: 'admin@skillsit.com.br',
        resource_type: 'Asset',
        page: 2,
      })
    );
  });

  test('passes user_id filter to client', async () => {
    const client = createMockClient();
    await executeActivityLogsTool({ user_id: 7 }, client);
    expect(client.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 7 })
    );
  });

  test('passes resource_id filter to client', async () => {
    const client = createMockClient();
    await executeActivityLogsTool({ resource_id: 42 }, client);
    expect(client.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ resource_id: 42 })
    );
  });

  test('passes start_date filter to client', async () => {
    const client = createMockClient();
    await executeActivityLogsTool({ start_date: '2026-01-01T00:00:00Z' }, client);
    expect(client.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: '2026-01-01T00:00:00Z' })
    );
  });

  test('returns success false on API error', async () => {
    const client = createMockClient({
      getActivityLogs: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('API 500')),
    });
    const result = await executeActivityLogsTool({}, client);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('error message includes original error text', async () => {
    const client = createMockClient({
      getActivityLogs: jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Unauthorized')),
    });
    const result = await executeActivityLogsTool({}, client);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});
