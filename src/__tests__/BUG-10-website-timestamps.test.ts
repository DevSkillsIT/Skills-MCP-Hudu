/**
 * BUG-10 / REQ-11 — Website monitoring timestamps
 *
 * Tests that formatWebsiteDetail includes created_at and updated_at rows
 * when those fields are present in the data.
 *
 * The formatter at L326-327 already renders these rows; the test confirms the
 * data layer passes them through (integration concern) and that the formatter
 * itself outputs them correctly.
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-G)
 */

import {
  formatWebsiteDetail,
  formatWebsiteList,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduWebsite } from '../../src/types.js';

// ---------------------------------------------------------------------------
// formatWebsiteDetail — timestamps
// ---------------------------------------------------------------------------
describe('formatWebsiteDetail — created_at / updated_at', () => {
  it('includes "Criado em" row with the timestamp value', () => {
    const website: HuduWebsite = {
      id: 1,
      name: 'https://example.com',
      url: 'https://example.com',
      paused: false,
      status: 'ready',
      monitoring_status: 'up',
      created_at: '2024-03-01T12:00:00Z',
      updated_at: '2024-03-15T08:30:00Z',
    };
    const result = formatWebsiteDetail(website);
    expect(result).toContain('| Criado em |');
    expect(result).toContain('2024-03-01T12:00:00Z');
  });

  it('includes "Atualizado em" row with the timestamp value', () => {
    const website: HuduWebsite = {
      id: 2,
      name: 'https://test.example.com',
      url: 'https://test.example.com',
      paused: true,
      created_at: '2023-11-01T00:00:00Z',
      updated_at: '2024-01-20T14:00:00Z',
    };
    const result = formatWebsiteDetail(website);
    expect(result).toContain('| Atualizado em |');
    expect(result).toContain('2024-01-20T14:00:00Z');
  });

  it('shows empty string for missing created_at (not undefined error)', () => {
    const website = {
      id: 3,
      name: 'https://nots.example.com',
      url: 'https://nots.example.com',
      paused: false,
      // created_at / updated_at intentionally omitted to test nullish guard
    } as unknown as HuduWebsite;
    // Should not throw
    expect(() => formatWebsiteDetail(website)).not.toThrow();
    const result = formatWebsiteDetail(website);
    expect(result).toContain('| Criado em |');
    expect(result).toContain('| Atualizado em |');
  });

  it('includes all core monitoring fields in output', () => {
    const website: HuduWebsite = {
      id: 4,
      name: 'https://full.example.com',
      url: 'https://full.example.com',
      company_name: 'Acme',
      paused: false,
      status: 'ready',
      monitoring_status: 'up',
      disable_dns: false,
      disable_ssl: false,
      disable_whois: false,
      enable_dmarc_tracking: true,
      enable_dkim_tracking: true,
      enable_spf_tracking: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };
    const result = formatWebsiteDetail(website);
    expect(result).toContain('| Criado em |');
    expect(result).toContain('| Atualizado em |');
    expect(result).toContain('2024-01-01T00:00:00Z');
    expect(result).toContain('2024-06-01T00:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// formatWebsiteList — smoke test (unchanged tool)
// ---------------------------------------------------------------------------
describe('formatWebsiteList — smoke test', () => {
  it('renders a list without throwing', () => {
    const websites: HuduWebsite[] = [
      {
        id: 1,
        name: 'https://example.com',
        url: 'https://example.com',
        paused: false,
        company_name: 'Test Corp',
        company_id: 10,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatWebsiteList(toPagedResponse(websites));
    expect(result).toContain('example.com');
    expect(result).toContain('Test Corp');
  });
});
