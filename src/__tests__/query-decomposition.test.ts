/**
 * Integration-style tests for query decomposition (normalization + token fallback).
 *
 * These tests exercise the search-aware dispatch path by calling the executor directly
 * via a thin test helper that replicates the normalise+fallback logic introduced in
 * src/utils/query-normalizer.ts and wired into server.ts.
 *
 * No live Hudu API is used — all client calls are Jest mocks.
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { executePasswordsQueryTool } from '../../src/tools/passwords.js';
import { executeCompaniesQueryTool } from '../../src/tools/companies.js';
import {
  normalizeSearchTerm,
  searchTokens,
  isSearchToolName,
} from '../../src/utils/query-normalizer.js';

// ---------------------------------------------------------------------------
// Thin test helper: replicates the runSearchAwareExecutor private method so we
// can test the full normalise+fallback cycle without instantiating HuduMcpServer.
// ---------------------------------------------------------------------------

type Executor = (args: any, client: any) => Promise<{ success: boolean; data?: any; error?: string; message?: string }>;

/**
 * Determines whether a ToolResponse text is "empty" (matches the PT-BR "Nenhum*" patterns
 * used by the Markdown formatters).
 *
 * This mirrors the looksEmpty() helper in server.ts.
 */
function looksEmptyText(text: string): boolean {
  return /Nenhum[a]?\b/i.test(text) || text.trim() === '';
}

/**
 * Extracts the formatted text from a ToolResponse (mirrors the server.ts path).
 * For unit tests we just use result.message or a simple serialisation.
 */
function getResponseText(result: Awaited<ReturnType<Executor>>): string {
  if (!result.success) return result.error ?? '';
  // In real server: formatToolResponse(name, result.data, args)
  // Here we simulate: if data is an empty array => "Nenhuma senha encontrada."
  if (Array.isArray(result.data) && result.data.length === 0) {
    return 'Nenhuma senha encontrada.';
  }
  if (result.message) return result.message;
  return JSON.stringify(result.data ?? '');
}

async function runSearchAwareExecutor(
  toolName: string,
  executor: Executor,
  args: any,
  client: any,
  formatResult: (result: Awaited<ReturnType<Executor>>) => string = getResponseText
): Promise<{ text: string; usedFallback: boolean; fallbackToken?: string }> {
  const searchField = args.query !== undefined ? 'query' : 'search';
  const original: string | undefined = args[searchField];

  const normalizedArgs = { ...args };
  if (isSearchToolName(toolName) && typeof original === 'string') {
    normalizedArgs[searchField] = normalizeSearchTerm(original);
  }

  const result = await executor(normalizedArgs, client);
  const text = formatResult(result);

  // Fallback: if empty result and multiple significant tokens exist, try each token
  if (
    isSearchToolName(toolName) &&
    typeof original === 'string' &&
    looksEmptyText(text)
  ) {
    const tokens = searchTokens(original);
    if (tokens.length >= 2) {
      for (const token of tokens) {
        const fallbackArgs = { ...args, [searchField]: token };
        const fallbackResult = await executor(fallbackArgs, client);
        const fallbackText = formatResult(fallbackResult);
        if (!looksEmptyText(fallbackText)) {
          return { text: fallbackText + ` [via token fallback: "${token}"]`, usedFallback: true, fallbackToken: token };
        }
      }
    }
  }

  return { text, usedFallback: false };
}

// ---------------------------------------------------------------------------
// Mocked client data
// ---------------------------------------------------------------------------

const MOCK_PASSWORD = {
  id: 42,
  name: 'Sankhya Oracle DB',
  company_id: 7,
  username: 'admin',
  password: 'supersecret',
  url: '',
};

const MOCK_COMPANY = {
  id: 7,
  name: 'Acme Corp',
  phone_number: '',
  website: 'https://example.com',
  city: 'Sao Paulo',
  state: 'SP',
  country_name: 'Brazil',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('query decomposition: verbose phrase → empty → token fallback', () => {
  let getAssetPasswordsMock: any;
  let getCompaniesMock: any;
  let mockClient: any;

  beforeEach(() => {
    getAssetPasswordsMock = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);
    getCompaniesMock = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);
    mockClient = {
      getAssetPasswords: getAssetPasswordsMock,
      getCompanies: getCompaniesMock,
    };
  });

  test('REPRODUCE BUG: exact phrase returns empty; after normalisation+fallback finds record', async () => {
    // Without the fix: direct call with literal phrase returns empty
    getAssetPasswordsMock.mockResolvedValue([]);

    const args = { search: 'preciso da senha do banco de dados do Sankhya na Oracle da Acme' };
    const rawResult = await executePasswordsQueryTool(args, mockClient);
    const rawText = getResponseText(rawResult);
    expect(looksEmptyText(rawText)).toBe(true); // BUG confirmed: empty on literal phrase

    // With the fix: runSearchAwareExecutor finds the record via token fallback
    getAssetPasswordsMock.mockReset();
    // First call (normalised phrase) → empty; then token attempts — first significant one finds it
    getAssetPasswordsMock
      .mockResolvedValueOnce([])          // normalised phrase → empty
      .mockResolvedValueOnce([MOCK_PASSWORD]); // first significant token → found

    const { text, usedFallback } = await runSearchAwareExecutor(
      'search_password_credentials',
      executePasswordsQueryTool as Executor,
      args,
      mockClient
    );

    expect(usedFallback).toBe(true);
    expect(looksEmptyText(text)).toBe(false);
    expect(text).toContain('[via token fallback');
  });

  test('single clean term is unaffected (no behavior change)', async () => {
    getAssetPasswordsMock.mockResolvedValue([MOCK_PASSWORD]);

    const args = { search: 'Sankhya' };
    const { text, usedFallback } = await runSearchAwareExecutor(
      'search_password_credentials',
      executePasswordsQueryTool as Executor,
      args,
      mockClient
    );

    // normalizeSearchTerm('Sankhya') === 'Sankhya' — no change, no fallback
    expect(usedFallback).toBe(false);
    // executor called exactly once
    expect(getAssetPasswordsMock).toHaveBeenCalledTimes(1);
    expect(getAssetPasswordsMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'Sankhya' }));
    expect(looksEmptyText(text)).toBe(false);
  });

  test('non-search tool is NOT normalized', async () => {
    // manage_ tools are not search tools — args must pass through unchanged
    const passthroughArgs = { action: 'get', id: 42 };
    const callHistory: any[] = [];

    const fakeExecutor: Executor = async (args) => {
      callHistory.push(args);
      return { success: true, data: MOCK_PASSWORD };
    };

    const { usedFallback } = await runSearchAwareExecutor(
      'manage_password_credentials',
      fakeExecutor,
      passthroughArgs,
      mockClient
    );

    expect(usedFallback).toBe(false);
    // Args must be identical (no search field to normalise)
    expect(callHistory[0]).toEqual(passthroughArgs);
  });

  test('company search: verbose phrase fallback finds company', async () => {
    getCompaniesMock
      .mockResolvedValueOnce([])           // normalised phrase → empty
      .mockResolvedValueOnce([MOCK_COMPANY]); // token "Acme" → found

    const args = { search: 'preciso encontrar a empresa Acme Corp' };

    const formatCompanyResult = (result: Awaited<ReturnType<Executor>>) => {
      if (!result.success) return result.error ?? '';
      if (Array.isArray(result.data) && result.data.length === 0) return 'Nenhuma empresa encontrada.';
      return JSON.stringify(result.data);
    };

    const { text, usedFallback } = await runSearchAwareExecutor(
      'search_company_information',
      executeCompaniesQueryTool as Executor,
      args,
      mockClient,
      formatCompanyResult
    );

    expect(usedFallback).toBe(true);
    expect(looksEmptyText(text)).toBe(false);
  });

  test('all tokens exhausted still returns original empty result gracefully', async () => {
    // All token attempts return empty — must return original empty, no error
    getAssetPasswordsMock.mockResolvedValue([]);

    const args = { search: 'preciso da senha do banco de dados do Sankhya na Oracle' };
    const { text, usedFallback } = await runSearchAwareExecutor(
      'search_password_credentials',
      executePasswordsQueryTool as Executor,
      args,
      mockClient
    );

    expect(usedFallback).toBe(false);
    // Result is the original empty string — no crash
    expect(typeof text).toBe('string');
  });
});
