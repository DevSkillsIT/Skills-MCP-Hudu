import { jest, describe, test, expect } from '@jest/globals';
import { executeExpirationsTool } from '../../tools/expirations.js';
import type { HuduClient } from '../../hudu-client.js';

const MOCK_EXPIRATIONS = [
  { id: 1, name: 'skillsit.com.br', expiration_date: '2026-06-15', item_type: 'Domain', company_id: 42 },
  { id: 2, name: 'SSL *.skillsit.com.br', expiration_date: '2026-08-01', item_type: 'SSL Certificate', company_id: 42 },
];

const mockFn = () => jest.fn<() => Promise<any>>().mockResolvedValue([]);

const createMockClient = (overrides: Record<string, ReturnType<typeof jest.fn>> = {}) => ({
  getExpirations: mockFn(),
  ...overrides,
} as unknown as HuduClient);

describe('executeExpirationsTool', () => {
  test('returns success with data when expirations found', async () => {
    const getExpirations = jest.fn<() => Promise<any>>().mockResolvedValue(MOCK_EXPIRATIONS);
    const client = { getExpirations } as unknown as HuduClient;
    const result = await executeExpirationsTool({ page: 1 }, client);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('returns empty data when no expirations found', async () => {
    const client = createMockClient();
    const result = await executeExpirationsTool({ page: 1 }, client);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('passes company_id filter to client', async () => {
    const client = createMockClient();
    await executeExpirationsTool({ company_id: 42, page: 1 }, client);
    expect(client.getExpirations).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: 42 })
    );
  });

  test('passes item_type filter to client', async () => {
    const client = createMockClient();
    await executeExpirationsTool({ item_type: 'SSL Certificate' }, client);
    expect(client.getExpirations).toHaveBeenCalledWith(
      expect.objectContaining({ item_type: 'SSL Certificate' })
    );
  });

  test('defaults page to 1 when not provided', async () => {
    const client = createMockClient();
    await executeExpirationsTool({}, client);
    expect(client.getExpirations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  test('passes combined filters to client', async () => {
    const client = createMockClient();
    await executeExpirationsTool({ company_id: 42, item_type: 'Domain', page: 2 }, client);
    expect(client.getExpirations).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: 42, item_type: 'Domain', page: 2 })
    );
  });

  test('handles API error gracefully', async () => {
    const getExpirations = jest.fn<() => Promise<any>>().mockRejectedValue(new Error('API 500'));
    const client = { getExpirations } as unknown as HuduClient;
    const result = await executeExpirationsTool({ page: 1 }, client);
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  test('error response contains error message', async () => {
    const getExpirations = jest.fn<() => Promise<any>>().mockRejectedValue(new Error('Connection timeout'));
    const client = { getExpirations } as unknown as HuduClient;
    const result = await executeExpirationsTool({ page: 1 }, client);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });
});
