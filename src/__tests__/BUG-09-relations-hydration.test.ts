/**
 * BUG-09 / REQ-09 — Entity relations name resolution
 *
 * Tests for formatRelationList and formatRelationDetail showing entity names
 * when available via optional hydrated fields (fromable_name, toable_name).
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-D)
 */

import {
  formatRelationList,
  formatRelationDetail,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduRelation } from '../../src/types.js';

// ---------------------------------------------------------------------------
// formatRelationList
// ---------------------------------------------------------------------------
describe('formatRelationList — entity name resolution', () => {
  it('shows type#id when names are absent (baseline behaviour)', () => {
    const relations: HuduRelation[] = [
      {
        id: 1,
        name: '',
        fromable_type: 'Company',
        fromable_id: 37,
        toable_type: 'Asset',
        toable_id: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatRelationList(toPagedResponse(relations));
    expect(result).toContain('Company#37');
    expect(result).toContain('Asset#12');
  });

  it('shows name with type and ID when fromable_name is provided', () => {
    const relations = [
      {
        id: 2,
        name: '',
        fromable_type: 'Company',
        fromable_id: 37,
        fromable_name: 'Acme Corp Matrix',
        toable_type: 'Asset',
        toable_id: 12,
        toable_name: 'Server-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduRelation[];
    const result = formatRelationList(toPagedResponse(relations));
    expect(result).toContain('Acme Corp Matrix');
    expect(result).toContain('ID: 37');
    expect(result).toContain('Server-01');
    expect(result).toContain('ID: 12');
    // Should NOT use the old "Company#37" pattern when name is present
    expect(result).not.toContain('Company#37');
  });

  it('handles mix of named and unnamed endpoints in same list', () => {
    const relations = [
      {
        id: 3,
        name: '',
        fromable_type: 'Article',
        fromable_id: 100,
        fromable_name: 'Setup Guide',
        toable_type: 'Asset',
        toable_id: 200,
        // toable_name NOT provided — falls back to Asset#200
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduRelation[];
    const result = formatRelationList(toPagedResponse(relations));
    expect(result).toContain('Setup Guide');
    expect(result).toContain('Asset#200');
  });

  it('returns empty message when no relations', () => {
    const result = formatRelationList(toPagedResponse([]));
    expect(result).toBe('Nenhuma relação encontrada.');
  });
});

// ---------------------------------------------------------------------------
// formatRelationDetail
// ---------------------------------------------------------------------------
describe('formatRelationDetail — entity name resolution', () => {
  it('shows type#id for Origem and Destino when names absent', () => {
    const relation: HuduRelation = {
      id: 10,
      name: '',
      fromable_type: 'Company',
      fromable_id: 5,
      toable_type: 'Website',
      toable_id: 8,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatRelationDetail(relation);
    expect(result).toContain('Company#5');
    expect(result).toContain('Website#8');
  });

  it('shows named format when fromable_name and toable_name present', () => {
    const relation = {
      id: 11,
      name: 'link',
      fromable_type: 'Company',
      fromable_id: 37,
      fromable_name: 'Acme Corp Matrix',
      toable_type: 'Asset',
      toable_id: 12,
      toable_name: 'Server-01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    } as unknown as HuduRelation;
    const result = formatRelationDetail(relation);
    expect(result).toContain('Acme Corp Matrix');
    expect(result).toContain('Server-01');
    expect(result).toContain('ID: 37');
    expect(result).toContain('ID: 12');
  });
});
