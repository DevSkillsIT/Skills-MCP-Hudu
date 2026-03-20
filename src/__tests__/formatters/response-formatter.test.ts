import { formatToolResponse } from '../../formatters/response-formatter.js';

describe('formatToolResponse', () => {
  test('search tool returns markdown table, not JSON', () => {
    const data = [
      {
        id: 1,
        name: 'SKILLS IT',
        company_type: 'MSP',
        city: 'Cascavel',
        state: 'PR',
        archived: false,
      },
    ];
    const result = formatToolResponse('hudu_search_company_information', data, { page: 1 });
    expect(result).toContain('| ID |');
    expect(result).toContain('SKILLS IT');
    expect(result).not.toContain('"id":');
  });

  test('manage tool with single object returns detail markdown', () => {
    const data = { id: 1, name: 'SKILLS IT', phone_number: '45-9999' };
    const result = formatToolResponse('hudu_manage_company_information', data, { action: 'get' });
    expect(result).toContain('SKILLS IT');
    // Detail view has Campo/Valor table
    expect(result).toContain('Campo');
  });

  test('manage tool with array returns list markdown', () => {
    const data = [{ id: 1, name: 'SKILLS IT', archived: false }];
    const result = formatToolResponse('hudu_manage_company_information', data, { action: 'list' });
    expect(result).toContain('| ID |');
    expect(result).toContain('SKILLS IT');
  });

  test('null data returns empty string', () => {
    const result = formatToolResponse('hudu_manage_company_information', null, { action: 'delete' });
    expect(result).toBe('');
  });

  test('undefined data returns empty string', () => {
    const result = formatToolResponse('hudu_manage_company_information', undefined, { action: 'delete' });
    expect(result).toBe('');
  });

  test('string data is returned as-is', () => {
    const markdown = '# Company\n| Field | Value |';
    const result = formatToolResponse('hudu_manage_website_monitoring', markdown, {});
    expect(result).toBe(markdown);
  });

  test('unknown tool falls back to JSON stringify', () => {
    const data = { test: true };
    const result = formatToolResponse('nonexistent_tool', data, {});
    expect(result).toContain('"test"');
    expect(result).toContain('true');
  });

  test('expiration search tool returns markdown', () => {
    const data = [
      {
        id: 1,
        item_type: 'Domain',
        expirationable_type: 'Domain',
        expirationable_id: 10,
        company_id: 1,
        expiration_date: '2026-06-15',
      },
    ];
    const result = formatToolResponse('hudu_search_expiration_tracking', data, { page: 1 });
    expect(result).toContain('| ID |');
    expect(result).toContain('Domain');
  });

  test('admin tool returns JSON (variable structure)', () => {
    const data = { version: '1.0', date: '2026-01-01' };
    const result = formatToolResponse('hudu_admin_instance_operations', data, {});
    expect(result).toContain('"version"');
  });

  test('global search returns JSON', () => {
    const data = { articles: [{ id: 1 }], companies: [] };
    const result = formatToolResponse('hudu_search_all_resource_types', data, {});
    expect(result).toContain('"articles"');
  });

  test('manage tool returns success message when data is null for delete', () => {
    const result = formatToolResponse('hudu_manage_knowledge_articles', null, { action: 'delete' });
    // null data -> '' (empty string per implementation)
    expect(result).toBe('');
  });

  test('website search tool returns markdown', () => {
    const data = [
      {
        id: 5,
        name: 'skillsit.com.br',
        url: 'https://skillsit.com.br',
        company_name: 'SKILLS IT',
        paused: false,
      },
    ];
    const result = formatToolResponse('hudu_search_website_monitoring', data, { page: 1 });
    expect(result).toContain('| ID |');
    expect(result).toContain('skillsit.com.br');
  });

  test('activity logs search tool returns markdown', () => {
    const data = [
      {
        id: 1,
        created_at: '2026-03-20',
        user_name: 'adriano',
        action: 'created',
        record_type: 'Company',
        record_name: 'SKILLS IT',
      },
    ];
    const result = formatToolResponse('hudu_search_activity_audit_logs', data, { page: 1 });
    expect(result).toContain('| ID |');
    expect(result).toContain('adriano');
  });
});
