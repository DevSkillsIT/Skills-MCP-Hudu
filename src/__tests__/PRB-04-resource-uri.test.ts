/**
 * PRB-04: Resource URI enum alignment (REQ-15)
 *
 * Tests:
 * - The readResourceTool uri enum matches the actual supported URIs
 * - The description is consistent with the enum
 * - Parameterized form is either in enum OR handled via id param (not promised in enum)
 */

import { readResourceTool } from '../tools/resource-tools.js';

describe('PRB-04: Resource URI enum alignment', () => {
  const schema = readResourceTool.inputSchema as any;

  test('readResourceTool has uri property', () => {
    expect(schema.properties).toHaveProperty('uri');
  });

  test('uri enum does not include parameterized {id} form (handled via id param)', () => {
    const uriEnum: string[] = schema.properties.uri.enum ?? [];
    const parameterizedForms = uriEnum.filter((u: string) => u.includes('{'));
    expect(parameterizedForms).toHaveLength(0);
  });

  test('uri description is consistent with enum — mentions id param for detail access', () => {
    const desc: string = schema.properties.uri.description ?? '';
    // Description should mention the id param or /ID pattern for company/asset/article detail
    expect(desc).toMatch(/id|\/\{id\}|\/42/i);
  });

  test('readResourceTool has id parameter for detail access', () => {
    expect(schema.properties).toHaveProperty('id');
  });

  test('uri enum contains the base collection URIs', () => {
    const uriEnum: string[] = schema.properties.uri.enum ?? [];
    expect(uriEnum).toContain('hudu://companies');
    expect(uriEnum).toContain('hudu://assets');
    expect(uriEnum).toContain('hudu://articles');
  });
});
