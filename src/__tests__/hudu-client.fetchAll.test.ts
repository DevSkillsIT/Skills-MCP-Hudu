import { jest, describe, test, expect } from '@jest/globals';

/**
 * Tests for HuduClient.fetchAll<T>() auto-pagination method.
 *
 * We test the algorithm directly by constructing a minimal object with just
 * the fetchAll method and a mock listMethod — no need to instantiate the
 * full HuduClient (which requires Axios + credentials).
 */

// Minimal replica of the fetchAll algorithm so we can test without Axios.
async function fetchAll<T>(
  listMethod: (params: any) => Promise<T[]>,
  params?: Record<string, any>,
  maxRecords: number = 500,
  pageSize: number = 25
): Promise<T[]> {
  const allRecords: T[] = [];
  let currentPage = 1;
  const maxPages = Math.ceil(maxRecords / pageSize);
  const safeMaxPages = Math.min(maxPages, 20);

  while (currentPage <= safeMaxPages) {
    const pageParams = { ...params, page: currentPage, page_size: pageSize };
    const results = await listMethod(pageParams);
    allRecords.push(...results);
    if (results.length < pageSize) break;
    if (allRecords.length >= maxRecords) break;
    currentPage++;
  }

  return allRecords.slice(0, maxRecords);
}

// Helper: generate N items
function items(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
}

describe('fetchAll auto-pagination', () => {
  test('single page with fewer items than pageSize', async () => {
    const list = jest.fn<(p: any) => Promise<any[]>>().mockResolvedValue(items(10));
    const result = await fetchAll(list, {}, 500, 25);
    expect(result).toHaveLength(10);
    expect(list).toHaveBeenCalledTimes(1);
  });

  test('multiple pages (25 + 25 + 10 = 60 items)', async () => {
    const list = jest.fn<(p: any) => Promise<any[]>>()
      .mockResolvedValueOnce(items(25))
      .mockResolvedValueOnce(items(25))
      .mockResolvedValueOnce(items(10));
    const result = await fetchAll(list, {}, 500, 25);
    expect(result).toHaveLength(60);
    expect(list).toHaveBeenCalledTimes(3);
  });

  test('respects maxRecords cap (truncates to 50)', async () => {
    // Each page returns 25; 3 pages = 75 but maxRecords = 50
    const list = jest.fn<(p: any) => Promise<any[]>>()
      .mockResolvedValue(items(25));
    const result = await fetchAll(list, {}, 50, 25);
    expect(result).toHaveLength(50);
    // Should stop after 2 pages (25+25=50 >= maxRecords)
    expect(list).toHaveBeenCalledTimes(2);
  });

  test('safety cap limits to 20 pages', async () => {
    // maxRecords=1000 with pageSize=25 would be 40 pages, but safeMaxPages = min(40,20) = 20
    const list = jest.fn<(p: any) => Promise<any[]>>()
      .mockResolvedValue(items(25));
    const result = await fetchAll(list, {}, 1000, 25);
    // 20 pages * 25 = 500
    expect(result).toHaveLength(500);
    expect(list).toHaveBeenCalledTimes(20);
  });

  test('empty first page returns empty array', async () => {
    const list = jest.fn<(p: any) => Promise<any[]>>().mockResolvedValue([]);
    const result = await fetchAll(list, {});
    expect(result).toHaveLength(0);
    expect(list).toHaveBeenCalledTimes(1);
  });

  test('passes page and page_size params correctly', async () => {
    const list = jest.fn<(p: any) => Promise<any[]>>().mockResolvedValue(items(5));
    await fetchAll(list, { company_id: 42 }, 100, 10);
    expect(list).toHaveBeenCalledWith({ company_id: 42, page: 1, page_size: 10 });
  });

  test('propagates error from listMethod', async () => {
    const list = jest.fn<(p: any) => Promise<any[]>>()
      .mockResolvedValueOnce(items(25))
      .mockRejectedValueOnce(new Error('API 500'));
    await expect(fetchAll(list, {})).rejects.toThrow('API 500');
    expect(list).toHaveBeenCalledTimes(2);
  });

  test('exactly pageSize items still fetches next page', async () => {
    // If first page returns exactly 25 (hasMore), should try page 2
    const list = jest.fn<(p: any) => Promise<any[]>>()
      .mockResolvedValueOnce(items(25))
      .mockResolvedValueOnce(items(0)); // empty second page
    const result = await fetchAll(list, {}, 500, 25);
    expect(result).toHaveLength(25);
    expect(list).toHaveBeenCalledTimes(2);
  });
});
