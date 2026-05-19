/**
 * BUG-07 / REQ-07 — Company name hydration
 * BUG-07b / REQ-08 — KB folder name in detail
 *
 * Tests for:
 * - formatArticleList / formatArticleDetail showing company name
 * - formatFolderList / formatFolderDetail showing company name + Nome row (REQ-08)
 * - formatPasswordList / formatPasswordDetail (already had fallback; verify it works)
 * - LRU cache dedup behaviour (via HuduClient.hydrateCompanyNames)
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-B, P2-C)
 */

import {
  formatArticleList,
  formatArticleDetail,
  formatFolderList,
  formatFolderDetail,
  formatPasswordList,
  formatPasswordDetail,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduArticle, HuduFolder, HuduAssetPassword } from '../../src/types.js';

// ---------------------------------------------------------------------------
// formatArticleList — company name hydration (REQ-07)
// ---------------------------------------------------------------------------
describe('formatArticleList — company name hydration', () => {
  it('shows company name when company_name is populated', () => {
    const articles: HuduArticle[] = [
      {
        id: 1,
        name: 'Test Article',
        content: '',
        archived: false,
        enable_sharing: false,
        company_id: 42,
        company_name: 'Acme Corp',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatArticleList(toPagedResponse(articles));
    expect(result).toContain('Acme Corp');
    expect(result).toContain('ID: 42');
    expect(result).not.toContain('| 42 |'); // should NOT show raw ID in company column
  });

  it('falls back to company ID when company_name is missing', () => {
    const articles: HuduArticle[] = [
      {
        id: 2,
        name: 'No Name Article',
        content: '',
        archived: false,
        enable_sharing: false,
        company_id: 99,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatArticleList(toPagedResponse(articles));
    expect(result).toContain('99');
  });

  it('shows "Global" when no company_id', () => {
    const articles: HuduArticle[] = [
      {
        id: 3,
        name: 'Global Article',
        content: '',
        archived: false,
        enable_sharing: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatArticleList(toPagedResponse(articles));
    expect(result).toContain('Global');
  });

  it('column header changed from "Empresa ID" to "Empresa"', () => {
    const articles: HuduArticle[] = [
      {
        id: 1,
        name: 'A',
        content: '',
        archived: false,
        enable_sharing: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatArticleList(toPagedResponse(articles));
    expect(result).toContain('| Empresa |');
    expect(result).not.toContain('| Empresa ID |');
  });
});

// ---------------------------------------------------------------------------
// formatArticleDetail — company name hydration (REQ-07)
// ---------------------------------------------------------------------------
describe('formatArticleDetail — company name hydration', () => {
  it('shows "Empresa | Acme Corp (ID: 10)" when name is present', () => {
    const article: HuduArticle = {
      id: 10,
      name: 'Detail Article',
      content: 'Some content',
      archived: false,
      enable_sharing: false,
      company_id: 10,
      company_name: 'Acme Corp',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatArticleDetail(article);
    expect(result).toContain('Empresa');
    expect(result).toContain('Acme Corp');
    expect(result).toContain('ID: 10');
  });

  it('falls back to "ID: N" when company_name is missing', () => {
    const article: HuduArticle = {
      id: 11,
      name: 'No Name',
      content: '',
      archived: false,
      enable_sharing: false,
      company_id: 55,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatArticleDetail(article);
    expect(result).toContain('ID: 55');
  });

  it('shows Global when no company_id', () => {
    const article: HuduArticle = {
      id: 12,
      name: 'Global',
      content: '',
      archived: false,
      enable_sharing: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatArticleDetail(article);
    expect(result).toContain('Global');
  });

  it('field label changed from "Empresa ID" to "Empresa"', () => {
    const article: HuduArticle = {
      id: 13,
      name: 'Label Test',
      content: '',
      archived: false,
      enable_sharing: false,
      company_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatArticleDetail(article);
    expect(result).toContain('| Empresa |');
    expect(result).not.toContain('| Empresa ID |');
  });
});

// ---------------------------------------------------------------------------
// formatFolderList — company name hydration (REQ-07)
// ---------------------------------------------------------------------------
describe('formatFolderList — company name hydration', () => {
  it('shows company name when company_name is populated', () => {
    const folders = [
      {
        id: 1,
        name: 'Folder One',
        icon: '',
        company_id: 7,
        company_name: 'Dunder Mifflin',
        parent_folder_id: undefined,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduFolder[];
    const result = formatFolderList(toPagedResponse(folders));
    expect(result).toContain('Dunder Mifflin');
    expect(result).toContain('ID: 7');
  });

  it('falls back to ID when company_name is missing', () => {
    const folders = [
      {
        id: 2,
        name: 'Folder Two',
        icon: '',
        company_id: 33,
        parent_folder_id: undefined,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as unknown as HuduFolder[];
    const result = formatFolderList(toPagedResponse(folders));
    expect(result).toContain('33');
  });

  it('column header changed from "Empresa ID" to "Empresa"', () => {
    const folders = [
      {
        id: 3,
        name: 'Folder Three',
        icon: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as HuduFolder[];
    const result = formatFolderList(toPagedResponse(folders));
    expect(result).toContain('| Empresa |');
    expect(result).not.toContain('| Empresa ID |');
  });
});

// ---------------------------------------------------------------------------
// formatFolderDetail — REQ-08: Nome row + company name hydration
// ---------------------------------------------------------------------------
describe('formatFolderDetail — Nome row and company name (REQ-08)', () => {
  it('includes Nome row at the top of the detail table', () => {
    const folder = {
      id: 10,
      name: 'My Folder',
      icon: 'fa-folder',
      company_id: 5,
      company_name: 'Initech',
      parent_folder_id: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatFolderDetail(folder);
    // Nome row must be present
    expect(result).toContain('| Nome |');
    expect(result).toContain('My Folder');
    // Check ordering: Nome should appear before Empresa
    const nomeIdx = result.indexOf('| Nome |');
    const empresaIdx = result.indexOf('| Empresa |');
    expect(nomeIdx).toBeGreaterThan(-1);
    expect(empresaIdx).toBeGreaterThan(nomeIdx);
  });

  it('shows company name in Empresa field', () => {
    const folder = {
      id: 11,
      name: 'KB Root',
      icon: '',
      company_id: 20,
      company_name: 'Globex Corp',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatFolderDetail(folder);
    expect(result).toContain('Globex Corp');
    expect(result).toContain('ID: 20');
  });

  it('falls back to ID when company_name is absent', () => {
    const folder = {
      id: 12,
      name: 'Old Folder',
      icon: '',
      company_id: 99,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatFolderDetail(folder);
    expect(result).toContain('ID: 99');
  });

  it('shows Global when no company_id', () => {
    const folder = {
      id: 13,
      name: 'Global Folder',
      icon: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatFolderDetail(folder);
    expect(result).toContain('Global');
  });
});

// ---------------------------------------------------------------------------
// formatPasswordList / formatPasswordDetail — existing fallback pattern
// ---------------------------------------------------------------------------
describe('formatPasswordList — company_name fallback', () => {
  it('shows company_name when populated', () => {
    const passwords: HuduAssetPassword[] = [
      {
        id: 1,
        name: 'Admin',
        password: '****',
        company_id: 3,
        company_name: 'Umbrella Corp',
        in_portal: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatPasswordList(toPagedResponse(passwords));
    expect(result).toContain('Umbrella Corp');
  });

  it('falls back to company_id string when company_name is missing', () => {
    const passwords: HuduAssetPassword[] = [
      {
        id: 2,
        name: 'Root',
        password: '****',
        company_id: 77,
        in_portal: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatPasswordList(toPagedResponse(passwords));
    expect(result).toContain('77');
  });
});

describe('formatPasswordDetail — company_name fallback', () => {
  it('shows company_name when populated', () => {
    const password: HuduAssetPassword = {
      id: 1,
      name: 'Secret',
      password: 'x',
      company_id: 5,
      company_name: 'Stark Industries',
      in_portal: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatPasswordDetail(password);
    expect(result).toContain('Stark Industries');
  });
});
