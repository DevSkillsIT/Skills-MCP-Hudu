import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS } from '../../tools/working-index.js';

// NOTE: Tool names were updated by P3-A (REQ-12) to remove the hudu_ prefix.
// Bridge tools (hudu_list_prompts, hudu_get_prompt, hudu_list_resources, hudu_read_resource)
// retain the hudu_ prefix as they are part of the MCPHub bridge interface.
const BRIDGE_TOOLS = new Set([
  'hudu_list_prompts',
  'hudu_get_prompt',
  'hudu_list_resources',
  'hudu_read_resource',
]);

describe('Tool Registry', () => {
  test('registers at least 43 tools', () => {
    expect(Object.keys(WORKING_TOOLS).length).toBeGreaterThanOrEqual(43);
  });

  test('all tools have a name property', () => {
    for (const [key, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });

  test('all tools have a description of at least 50 characters', () => {
    for (const [key, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.description).toBeDefined();
      expect((tool.description ?? '').length).toBeGreaterThan(50);
    }
  });

  test('all tools have matching executors', () => {
    for (const key of Object.keys(WORKING_TOOLS)) {
      expect(WORKING_TOOL_EXECUTORS[key]).toBeDefined();
    }
  });

  test('Phase 3 tools are registered (new names without hudu_ prefix)', () => {
    const expectedTools = [
      'search_expiration_tracking',
      'manage_website_monitoring',
      'search_website_monitoring',
      'manage_asset_layout_templates',
      'search_asset_layout_templates',
      'search_activity_audit_logs',
      'manage_entity_relations',
      'search_entity_relations',
      'manage_dashboard_widgets',
      'search_dashboard_widgets',
    ];
    for (const name of expectedTools) {
      expect(WORKING_TOOLS[name]).toBeDefined();
      expect(WORKING_TOOL_EXECUTORS[name]).toBeDefined();
    }
  });

  test('core tools are registered (new names without hudu_ prefix)', () => {
    const coreTools = [
      'manage_knowledge_articles',
      'search_knowledge_articles',
      'manage_company_information',
      'search_company_information',
      'manage_it_asset_inventory',
      'search_it_asset_inventory',
      'manage_password_credentials',
      'search_password_credentials',
    ];
    for (const name of coreTools) {
      expect(WORKING_TOOLS[name]).toBeDefined();
      expect(WORKING_TOOL_EXECUTORS[name]).toBeDefined();
    }
  });

  test('utility tools are registered (new names without hudu_ prefix)', () => {
    const utilityTools = [
      'admin_instance_operations',
      'search_all_resource_types',
      'navigate_to_resource_by_name',
    ];
    for (const name of utilityTools) {
      expect(WORKING_TOOLS[name]).toBeDefined();
      expect(WORKING_TOOL_EXECUTORS[name]).toBeDefined();
    }
  });

  test('non-bridge tool names do not have hudu_ prefix (P3-A convention)', () => {
    for (const [key, tool] of Object.entries(WORKING_TOOLS)) {
      if (!BRIDGE_TOOLS.has(key)) {
        expect(tool.name).not.toMatch(/^hudu_/);
      }
    }
  });

  test('bridge tools retain hudu_ prefix (MCPHub bridge interface)', () => {
    for (const bridgeName of BRIDGE_TOOLS) {
      if (WORKING_TOOLS[bridgeName]) {
        expect(WORKING_TOOLS[bridgeName].name).toMatch(/^hudu_/);
      }
    }
  });

  test('tool executors are functions', () => {
    for (const [key, executor] of Object.entries(WORKING_TOOL_EXECUTORS)) {
      expect(typeof executor).toBe('function');
    }
  });
});
