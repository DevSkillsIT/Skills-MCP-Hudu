import {
  toPagedResponse,
  formatCompanyList,
  formatCompanyDetail,
  formatAssetList,
  formatArticleList,
  formatArticleDetail,
  formatExpirationList,
  formatWebsiteList,
  formatWebsiteDetail,
  formatActivityLogList,
  formatPasswordList,
} from '../../formatters/markdown.js';

// ---------------------------------------------------------------------------
// toPagedResponse
// ---------------------------------------------------------------------------

describe('toPagedResponse', () => {
  test('wraps array with page info', () => {
    const result = toPagedResponse([1, 2, 3], 1, 25);
    expect(result.records).toEqual([1, 2, 3]);
    expect(result.page).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  test('detects hasMore when records count equals pageSize', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const result = toPagedResponse(items, 1, 25);
    expect(result.hasMore).toBe(true);
  });

  test('handles null records gracefully', () => {
    // The implementation does (records || []) so null becomes []
    const result = toPagedResponse(null as unknown as never[], 1);
    expect(result.records).toEqual([]);
  });

  test('defaults to page 1 and pageSize 25', () => {
    const result = toPagedResponse([1, 2]);
    expect(result.page).toBe(1);
    expect(result.hasMore).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatCompanyList
// ---------------------------------------------------------------------------

describe('formatCompanyList', () => {
  test('formats companies as markdown table', () => {
    const data = toPagedResponse([
      {
        id: 1,
        name: 'SKILLS IT',
        company_type: 'MSP',
        city: 'Cascavel',
        state: 'PR',
        archived: false,
      } as any,
    ]);
    const result = formatCompanyList(data);
    expect(result).toContain('**1 resultados**');
    expect(result).toContain('| ID |');
    expect(result).toContain('SKILLS IT');
  });

  test('returns friendly message for empty list', () => {
    const result = formatCompanyList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });

  test('includes pagination info when hasMore is true', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `Co ${i}`,
      archived: false,
    })) as any[];
    const result = formatCompanyList(toPagedResponse(items, 1, 25));
    // The pageInfo function includes "próxima" (next page reference)
    expect(result).toContain('xima');
  });

  test('shows archived status in status column', () => {
    const data = toPagedResponse([
      { id: 2, name: 'Old Corp', archived: true } as any,
    ]);
    const result = formatCompanyList(data);
    expect(result).toContain('Arquivado');
  });
});

// ---------------------------------------------------------------------------
// formatCompanyDetail
// ---------------------------------------------------------------------------

describe('formatCompanyDetail', () => {
  test('formats company as detail view with pt-BR headers', () => {
    const company = {
      id: 1,
      name: 'SKILLS IT',
      phone_number: '45-9999',
      city: 'Cascavel',
      state: 'PR',
      created_at: '2025-01-01',
      updated_at: '2025-06-01',
    } as any;
    const result = formatCompanyDetail(company);
    expect(result).toContain('# Empresa: SKILLS IT');
    expect(result).toContain('SKILLS IT');
    expect(result).toContain('| Campo | Valor |');
  });

  test('shows phone number in table', () => {
    const company = {
      id: 1,
      name: 'Corp',
      phone_number: '45-9999',
      created_at: '',
      updated_at: '',
    } as any;
    const result = formatCompanyDetail(company);
    expect(result).toContain('45-9999');
  });

  test('shows archived status', () => {
    const company = { id: 1, name: 'Archived Co', archived: true } as any;
    const result = formatCompanyDetail(company);
    expect(result).toContain('Arquivado');
  });
});

// ---------------------------------------------------------------------------
// formatAssetList
// ---------------------------------------------------------------------------

describe('formatAssetList', () => {
  test('formats assets as markdown table', () => {
    const data = toPagedResponse([
      {
        id: 10,
        name: 'Server-01',
        company_name: 'SKILLS IT',
        company_id: 1,
        asset_layout_id: 5,
        primary_serial: 'SN001',
        archived: false,
      } as any,
    ]);
    const result = formatAssetList(data);
    expect(result).toContain('Server-01');
    expect(result).toContain('| ID |');
    expect(result).toContain('**1 resultados**');
  });

  test('returns friendly message for empty list', () => {
    const result = formatAssetList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });
});

// ---------------------------------------------------------------------------
// formatArticleList
// ---------------------------------------------------------------------------

describe('formatArticleList', () => {
  test('formats articles as markdown table', () => {
    const data = toPagedResponse([
      {
        id: 5,
        name: 'How to configure VPN',
        company_id: 1,
        draft: false,
        updated_at: '2025-06-01',
      } as any,
    ]);
    const result = formatArticleList(data);
    expect(result).toContain('How to configure VPN');
    expect(result).toContain('| ID |');
  });

  test('returns friendly message for empty list', () => {
    const result = formatArticleList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });
});

// ---------------------------------------------------------------------------
// formatArticleDetail
// ---------------------------------------------------------------------------

describe('formatArticleDetail', () => {
  test('strips HTML from content', () => {
    const article = {
      id: 1,
      name: 'Test',
      content: '<p>Hello <b>World</b></p>&amp; more',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    } as any;
    const result = formatArticleDetail(article);
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<b>');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  test('shows "Sem conteúdo." when content is missing', () => {
    const article = {
      id: 1,
      name: 'Empty',
      content: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    } as any;
    const result = formatArticleDetail(article);
    expect(result).toContain('Sem conteúdo');
  });

  test('renders article heading', () => {
    const article = {
      id: 1,
      name: 'My Article',
      content: 'Body text',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    } as any;
    const result = formatArticleDetail(article);
    expect(result).toContain('# Artigo KB: My Article');
  });
});

// ---------------------------------------------------------------------------
// formatExpirationList
// ---------------------------------------------------------------------------

describe('formatExpirationList', () => {
  test('formats expirations as markdown table', () => {
    const data = toPagedResponse([
      {
        id: 1,
        // The formatter uses expiration_type || item_type for type column
        item_type: 'Domain',
        // expirationable_type || item_type for resource column
        expirationable_type: 'Domain',
        expirationable_id: 99,
        company_id: 42,
        // The formatter uses date || expiration_date for date column
        expiration_date: '2026-06-15',
      } as any,
    ]);
    const result = formatExpirationList(data);
    expect(result).toContain('| ID |');
    expect(result).toContain('Domain');
    expect(result).toContain('2026-06-15');
  });

  test('returns friendly message for empty list', () => {
    const result = formatExpirationList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });
});

// ---------------------------------------------------------------------------
// formatPasswordList
// ---------------------------------------------------------------------------

describe('formatPasswordList', () => {
  test('does not expose password value in list output', () => {
    const data = toPagedResponse([
      {
        id: 1,
        name: 'Admin',
        username: 'admin',
        password: 'secret123',
        url: 'https://example.com',
      } as any,
    ]);
    const result = formatPasswordList(data);
    // Password field is not part of list formatter columns (ID, Nome, Usuário, URL, Empresa)
    expect(result).not.toContain('secret123');
  });

  test('formats list columns correctly', () => {
    const data = toPagedResponse([
      {
        id: 1,
        name: 'Admin',
        username: 'admin',
        url: 'https://example.com',
        company_name: 'SKILLS IT',
      } as any,
    ]);
    const result = formatPasswordList(data);
    expect(result).toContain('| ID |');
    expect(result).toContain('Admin');
    expect(result).toContain('admin');
  });

  test('returns friendly message for empty list', () => {
    const result = formatPasswordList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });
});

// ---------------------------------------------------------------------------
// formatWebsiteList
// ---------------------------------------------------------------------------

describe('formatWebsiteList', () => {
  test('formats websites as markdown table', () => {
    const data = toPagedResponse([
      {
        id: 1,
        name: 'SKILLS',
        url: 'https://skillsit.com.br',
        company_name: 'SKILLS IT',
        paused: false,
      } as any,
    ]);
    const result = formatWebsiteList(data);
    expect(result).toContain('skillsit.com.br');
    expect(result).toContain('| ID |');
  });

  test('returns friendly message for empty list', () => {
    const result = formatWebsiteList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });
});

// ---------------------------------------------------------------------------
// formatWebsiteDetail
// ---------------------------------------------------------------------------

describe('formatWebsiteDetail', () => {
  test('includes DNS and SSL monitoring fields', () => {
    const website = {
      id: 1,
      name: 'SKILLS',
      url: 'https://skillsit.com.br',
      disable_dns: false,
      disable_ssl: false,
      disable_whois: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    } as any;
    const result = formatWebsiteDetail(website);
    expect(result).toContain('DNS');
    expect(result).toContain('SSL');
  });

  test('shows website heading', () => {
    const website = {
      id: 1,
      name: 'Portal SKILLS',
      url: 'https://skills.com',
    } as any;
    const result = formatWebsiteDetail(website);
    expect(result).toContain('# Website:');
    expect(result).toContain('Portal SKILLS');
  });

  test('shows monitoring status for disabled WHOIS', () => {
    const website = {
      id: 1,
      name: 'Test Site',
      url: 'https://test.com',
      disable_whois: true,
    } as any;
    const result = formatWebsiteDetail(website);
    expect(result).toContain('WHOIS');
    expect(result).toContain('Desativado');
  });
});

// ---------------------------------------------------------------------------
// formatActivityLogList
// ---------------------------------------------------------------------------

describe('formatActivityLogList', () => {
  test('formats activity logs as markdown table', () => {
    const data = toPagedResponse([
      {
        id: 100,
        created_at: '2026-03-20T10:00:00Z',
        user_name: 'adriano',
        action: 'created',
        record_type: 'Company',
        record_name: 'SKILLS IT',
      } as any,
    ]);
    const result = formatActivityLogList(data);
    expect(result).toContain('| ID |');
    expect(result).toContain('adriano');
    expect(result).toContain('created');
  });

  test('returns friendly message for empty list', () => {
    const result = formatActivityLogList(toPagedResponse([]));
    expect(result.toLowerCase()).toContain('nenhum');
  });
});
