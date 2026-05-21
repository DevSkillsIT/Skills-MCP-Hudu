/**
 * BUG-09 / REQ-09 — Entity relation readability
 *
 * Live-API finding (2026-05-21): the Hudu API returns each relation with a
 * single `name` (the related entity's name), both endpoint `*_url`s, and the
 * endpoint TYPE + ID — but NO separate fromable_name / toable_name fields.
 * The fix renders each endpoint as `Type#id` and surfaces the `name` column
 * plus the endpoint URLs (in detail), giving readability without N+1 lookups.
 *
 * These tests validate against the REAL API shape.
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-D), revised after live validation.
 */

import {
  formatRelationList,
  formatRelationDetail,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduRelation } from '../../src/types.js';

// Mirrors the real Hudu API payload for GET /relations.
const realRelation: HuduRelation = {
  id: 20,
  name: 'Example Firewall',
  description: '172.18.70.0/24',
  is_inverse: true,
  fromable_type: 'IpAddress',
  fromable_id: 4,
  fromable_url: 'https://hudu.example.com/ip_addresses/c56789dbf7f6',
  toable_type: 'Asset',
  toable_id: 976,
  toable_url: 'https://hudu.example.com/a/7f23df6da7c7',
  created_at: '2025-08-05T00:00:00Z',
  updated_at: '2025-08-05T00:00:00Z',
};

describe('formatRelationList — readability', () => {
  it('renders both endpoints as Type#id (precise, unambiguous)', () => {
    const result = formatRelationList(toPagedResponse([realRelation]));
    expect(result).toContain('IpAddress#4');
    expect(result).toContain('Asset#976');
  });

  it('surfaces the relation name field in a Nome column', () => {
    const result = formatRelationList(toPagedResponse([realRelation]));
    expect(result).toContain('Nome'); // header
    expect(result).toContain('Example Firewall');
  });

  it('shows "-" for name when the relation has no name', () => {
    const result = formatRelationList(
      toPagedResponse([{ ...realRelation, id: 99, name: '' }])
    );
    expect(result).toContain('IpAddress#4');
    expect(result).toMatch(/\| - \|/);
  });

  it('returns empty message when no relations', () => {
    const result = formatRelationList(toPagedResponse([]));
    expect(result).toBe('Nenhuma relação encontrada.');
  });
});

describe('formatRelationDetail — readability', () => {
  it('shows Origem/Destino as Type#id', () => {
    const result = formatRelationDetail(realRelation);
    expect(result).toContain('| Origem | IpAddress#4 |');
    expect(result).toContain('| Destino | Asset#976 |');
  });

  it('surfaces the relation name', () => {
    const result = formatRelationDetail(realRelation);
    expect(result).toContain('| Nome | Example Firewall |');
  });

  it('surfaces endpoint URLs when present', () => {
    const result = formatRelationDetail(realRelation);
    expect(result).toContain('| URL Origem |');
    expect(result).toContain('| URL Destino |');
    expect(result).toContain('/ip_addresses/c56789dbf7f6');
  });

  it('omits URL rows when the API did not return them', () => {
    const minimal: HuduRelation = {
      id: 30,
      name: '',
      fromable_type: 'Company',
      fromable_id: 5,
      toable_type: 'Website',
      toable_id: 8,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatRelationDetail(minimal);
    expect(result).toContain('Company#5');
    expect(result).toContain('Website#8');
    expect(result).not.toContain('| URL Origem |');
  });
});
