import { describe, test, expect } from '@jest/globals';
import {
  normalizeSearchTerm,
  searchTokens,
  isSearchToolName,
} from '../../src/utils/query-normalizer.js';

describe('normalizeSearchTerm', () => {
  test('strips PT-BR intent verbs', () => {
    expect(normalizeSearchTerm('preciso da senha do Sankhya')).toBe('senha Sankhya');
  });

  test('strips articles and prepositions, keeps proper nouns', () => {
    expect(normalizeSearchTerm('preciso da senha do banco de dados do Sankhya na Oracle da Acme')).toContain('Sankhya');
    expect(normalizeSearchTerm('preciso da senha do banco de dados do Sankhya na Oracle da Acme')).toContain('Oracle');
    expect(normalizeSearchTerm('preciso da senha do banco de dados do Sankhya na Oracle da Acme')).toContain('Acme');
  });

  test('does NOT strip generic nouns like senha, banco, dados, acesso', () => {
    const result = normalizeSearchTerm('senha banco dados acesso');
    // These are not stopwords — user may legitimately search for records named "senha"
    expect(result).toBe('senha banco dados acesso');
  });

  test('preserves original casing of kept tokens', () => {
    const result = normalizeSearchTerm('preciso do Oracle-PROD');
    expect(result).toBe('Oracle-PROD');
  });

  test('removes tokens shorter than 2 chars', () => {
    const result = normalizeSearchTerm('a b c Sankhya');
    expect(result).toBe('Sankhya');
  });

  test('never returns empty string when input was non-empty', () => {
    // All words are stopwords — must fall back to original trimmed string
    expect(normalizeSearchTerm('preciso de buscar')).toBe('preciso de buscar');
  });

  test('returns empty string for undefined input', () => {
    expect(normalizeSearchTerm(undefined)).toBe('');
  });

  test('returns empty string for empty string input', () => {
    expect(normalizeSearchTerm('')).toBe('');
  });

  test('handles single proper noun with no noise', () => {
    expect(normalizeSearchTerm('Sankhya')).toBe('Sankhya');
  });

  test('strips quero, gostaria, ver, encontrar intent verbs', () => {
    // 'ver' and 'encontrar' are intent verbs listed in STOPWORDS_PT
    const r1 = normalizeSearchTerm('quero ver Oracle');
    expect(r1).toBe('Oracle');
    const r2 = normalizeSearchTerm('gostaria de encontrar Firewall');
    expect(r2).toBe('Firewall');
  });

  test('trims leading and trailing whitespace', () => {
    expect(normalizeSearchTerm('  Sankhya  ')).toBe('Sankhya');
  });
});

describe('searchTokens', () => {
  test('returns significant tokens ordered by length descending', () => {
    const tokens = searchTokens('preciso da senha do Sankhya na Oracle da Acme');
    // Longest tokens first: Sankhya (7), Oracle (6), senha (5), Acme (4)
    expect(tokens[0].length).toBeGreaterThanOrEqual(tokens[1]?.length ?? 0);
  });

  test('deduplicates tokens', () => {
    const tokens = searchTokens('Sankhya Sankhya Oracle');
    const unique = new Set(tokens.map((t: string) => t.toLowerCase()));
    expect(unique.size).toBe(tokens.length);
  });

  test('caps at 4 tokens maximum', () => {
    const tokens = searchTokens('Alpha Bravo Charlie Delta Echo Foxtrot');
    expect(tokens.length).toBeLessThanOrEqual(4);
  });

  test('returns empty array for empty/undefined input', () => {
    expect(searchTokens(undefined)).toEqual([]);
    expect(searchTokens('')).toEqual([]);
  });

  test('returns empty array when all tokens are stopwords or too short', () => {
    // All stopwords — no significant tokens to return
    const tokens = searchTokens('de da do e em');
    expect(tokens).toEqual([]);
  });
});

describe('isSearchToolName', () => {
  test('returns true for search_ prefixed tools', () => {
    expect(isSearchToolName('search_password_credentials')).toBe(true);
    expect(isSearchToolName('search_company_information')).toBe(true);
    expect(isSearchToolName('search_all_resource_types')).toBe(true);
    expect(isSearchToolName('search_it_asset_inventory')).toBe(true);
  });

  test('returns true for navigate_to_resource_by_name', () => {
    expect(isSearchToolName('navigate_to_resource_by_name')).toBe(true);
  });

  test('returns false for manage_ tools', () => {
    expect(isSearchToolName('manage_password_credentials')).toBe(false);
    expect(isSearchToolName('manage_company_information')).toBe(false);
  });

  test('returns false for admin tool', () => {
    expect(isSearchToolName('admin_instance_operations')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isSearchToolName('')).toBe(false);
  });
});
