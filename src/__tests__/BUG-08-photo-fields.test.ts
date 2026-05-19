/**
 * BUG-08 / REQ-10 — Public photo gallery name/filename surfacing
 *
 * Tests that formatPublicPhotoList and formatPublicPhotoDetail show '-' as
 * placeholder for empty/absent name and filename instead of blank cells.
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-F)
 */

import {
  formatPublicPhotoList,
  formatPublicPhotoDetail,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduPublicPhoto } from '../../src/types.js';

// ---------------------------------------------------------------------------
// formatPublicPhotoList
// ---------------------------------------------------------------------------
describe('formatPublicPhotoList — name and filename surfacing', () => {
  it('shows name and filename when populated', () => {
    const photos: HuduPublicPhoto[] = [
      {
        id: 1,
        name: 'Server Photo',
        filename: 'server-photo.jpg',
        url: 'https://example.com/photo.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatPublicPhotoList(toPagedResponse(photos));
    expect(result).toContain('Server Photo');
    expect(result).toContain('server-photo.jpg');
    expect(result).toContain('https://example.com/photo.jpg');
  });

  it('shows dash placeholder for absent name', () => {
    const photos = [
      {
        id: 2,
        // name is absent (API may not return it)
        filename: 'img.png',
        url: 'https://example.com/img.png',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduPublicPhoto[];
    const result = formatPublicPhotoList(toPagedResponse(photos));
    // The name column should show '-', not be empty
    expect(result).toMatch(/\| - \|/);
  });

  it('shows dash placeholder for absent filename', () => {
    const photos = [
      {
        id: 3,
        name: 'Logo',
        // filename is absent
        url: 'https://example.com/logo.png',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduPublicPhoto[];
    const result = formatPublicPhotoList(toPagedResponse(photos));
    // The filename column should show '-', not be empty
    expect(result).toMatch(/\| - \|/);
  });

  it('shows dash for both when both absent', () => {
    const photos = [
      {
        id: 4,
        url: 'https://example.com/x.png',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduPublicPhoto[];
    const result = formatPublicPhotoList(toPagedResponse(photos));
    // Row: | 4 | - | - | url | — the two '-' columns are adjacent so the regex
    // `\| - \|` only matches once due to non-overlapping. Use a row-level match.
    expect(result).toMatch(/\| 4 \| - \| - \|/);
  });
});

// ---------------------------------------------------------------------------
// formatPublicPhotoDetail
// ---------------------------------------------------------------------------
describe('formatPublicPhotoDetail — name and filename surfacing', () => {
  it('shows name row in detail', () => {
    const photo = {
      id: 10,
      name: 'Cabinet Photo',
      filename: 'cabinet.jpg',
      url: 'https://example.com/cabinet.jpg',
      record_type: 'Asset',
      record_id: 5,
      created_at: '2024-01-01T00:00:00Z',
    };
    const result = formatPublicPhotoDetail(photo);
    expect(result).toContain('| Nome |');
    expect(result).toContain('Cabinet Photo');
  });

  it('shows dash for absent name', () => {
    const photo = {
      id: 11,
      filename: 'img.jpg',
      url: 'https://example.com/img.jpg',
      created_at: '2024-01-01T00:00:00Z',
    };
    const result = formatPublicPhotoDetail(photo);
    expect(result).toContain('| Nome |');
    // Nome row should show '-'
    expect(result).toMatch(/Nome.*-/s);
  });

  it('shows dash for absent filename', () => {
    const photo = {
      id: 12,
      name: 'Something',
      url: 'https://example.com/x.jpg',
      created_at: '2024-01-01T00:00:00Z',
    };
    const result = formatPublicPhotoDetail(photo);
    expect(result).toContain('| Arquivo |');
    expect(result).toMatch(/Arquivo.*-/s);
  });

  it('shows dash for absent url', () => {
    const photo = {
      id: 13,
      name: 'X',
      filename: 'x.jpg',
      created_at: '2024-01-01T00:00:00Z',
    };
    const result = formatPublicPhotoDetail(photo);
    expect(result).toContain('| URL |');
    expect(result).toMatch(/URL.*-/s);
  });
});
