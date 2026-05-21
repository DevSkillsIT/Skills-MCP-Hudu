import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS } from '../../tools/working-index.js';

// All tools use the hudu_ namespace prefix. The prefix is the MCP server's
// namespace and is required for direct (non-aggregator) client connections
// where tool names from multiple MCPs share a flat namespace. (REQ-12 rename
// was reverted — the prefix is intentional.)

describe('Tool Registry', () => {
  test('registers at least 43 tools', () => {
    expect(Object.keys(WORKING_TOOLS).length).toBeGreaterThanOrEqual(43);
  });

  test('all tools have a name property', () => {
    for (const [, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });

  test('all tools have a description of at least 50 characters', () => {
    for (const [, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.description).toBeDefined();
      expect((tool.description ?? '').length).toBeGreaterThan(50);
    }
  });

  test('all tools have matching executors', () => {
    for (const key of Object.keys(WORKING_TOOLS)) {
      expect(WORKING_TOOL_EXECUTORS[key]).toBeDefined();
    }
  });

  test('Phase 3 tools are registered (hudu_ prefixed names)', () => {
    const expectedTools = [
      'hudu_search_expiration_tracking',
      'hudu_manage_website_monitoring',
      'hudu_search_website_monitoring',
      'hudu_manage_asset_layout_templates',
      'hudu_search_asset_layout_templates',
      'hudu_search_activity_audit_logs',
      'hudu_manage_entity_relations',
      'hudu_search_entity_relations',
      'hudu_manage_dashboard_widgets',
      'hudu_search_dashboard_widgets',
    ];
    for (const name of expectedTools) {
      expect(WORKING_TOOLS[name]).toBeDefined();
      expect(WORKING_TOOL_EXECUTORS[name]).toBeDefined();
    }
  });

  test('core tools are registered (hudu_ prefixed names)', () => {
    const coreTools = [
      'hudu_manage_knowledge_articles',
      'hudu_search_knowledge_articles',
      'hudu_manage_company_information',
      'hudu_search_company_information',
      'hudu_manage_it_asset_inventory',
      'hudu_search_it_asset_inventory',
      'hudu_manage_password_credentials',
      'hudu_search_password_credentials',
    ];
    for (const name of coreTools) {
      expect(WORKING_TOOLS[name]).toBeDefined();
      expect(WORKING_TOOL_EXECUTORS[name]).toBeDefined();
    }
  });

  test('utility tools are registered (hudu_ prefixed names)', () => {
    const utilityTools = [
      'hudu_admin_instance_operations',
      'hudu_search_all_resource_types',
      'hudu_navigate_to_resource_by_name',
    ];
    for (const name of utilityTools) {
      expect(WORKING_TOOLS[name]).toBeDefined();
      expect(WORKING_TOOL_EXECUTORS[name]).toBeDefined();
    }
  });

  test('every registered tool name carries the hudu_ namespace prefix', () => {
    for (const [, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.name).toMatch(/^hudu_/);
    }
  });

  test('registry key matches the tool name field', () => {
    for (const [key, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.name).toBe(key);
    }
  });

  test('tool executors are functions', () => {
    for (const [, executor] of Object.entries(WORKING_TOOL_EXECUTORS)) {
      expect(typeof executor).toBe('function');
    }
  });
});
