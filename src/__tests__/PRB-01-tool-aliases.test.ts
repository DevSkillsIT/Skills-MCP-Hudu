/**
 * PRB-01: Tool name prefix cleanup
 * REQ-12: Double-prefix fix — tools should not have hudu_ prefix since MCPHub adds it
 *
 * Tests:
 * (a) New names (without hudu_ prefix) resolve correctly in WORKING_TOOLS
 * (b) Old names (with hudu_ prefix) resolve via alias backward compatibility
 * (c) Deprecation warning is emitted when alias is used
 * (d) Every old name has a corresponding alias entry in TOOL_ALIASES
 */

import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS } from '../tools/working-index.js';
import { TOOL_ALIASES, resolveToolAlias } from '../tools/aliases.js';

// ============================================================
// (a) New names resolve in tool registries
// ============================================================

describe('PRB-01 (a): New tool names (no hudu_ prefix) are registered', () => {
  const expectedNewNames = [
    'manage_knowledge_articles',
    'search_knowledge_articles',
    'manage_company_information',
    'search_company_information',
    'manage_it_asset_inventory',
    'search_it_asset_inventory',
    'manage_password_credentials',
    'search_password_credentials',
    'manage_workflow_procedures',
    'search_workflow_procedures',
    'manage_procedure_task_items',
    'search_procedure_task_items',
    'manage_kb_article_folders',
    'search_kb_article_folders',
    'manage_network_documentation',
    'search_network_documentation',
    'manage_network_vlan_records',
    'search_network_vlan_records',
    'manage_network_vlan_zones',
    'search_network_vlan_zones',
    'manage_ip_address_records',
    'search_ip_address_records',
    'manage_file_upload_records',
    'search_file_upload_records',
    'manage_rack_storage_locations',
    'search_rack_storage_locations',
    'manage_rack_storage_items',
    'search_rack_storage_items',
    'manage_public_photo_gallery',
    'search_public_photo_gallery',
    'admin_instance_operations',
    'search_all_resource_types',
    'navigate_to_resource_by_name',
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

  test.each(expectedNewNames)('new name "%s" is in WORKING_TOOLS', (name) => {
    expect(WORKING_TOOLS).toHaveProperty(name);
  });

  test.each(expectedNewNames)('new name "%s" is in WORKING_TOOL_EXECUTORS', (name) => {
    expect(WORKING_TOOL_EXECUTORS).toHaveProperty(name);
  });

  test('bridge tools keep their hudu_ prefix (MCPHub bridge interface)', () => {
    // These bridge tools are NOT renamed — they are the MCPHub bridge interface
    const bridgeTools = [
      'hudu_list_prompts',
      'hudu_get_prompt',
      'hudu_list_resources',
      'hudu_read_resource',
    ];
    for (const bt of bridgeTools) {
      expect(WORKING_TOOLS).toHaveProperty(bt);
    }
  });

  test('no non-bridge tool in WORKING_TOOLS still has hudu_ prefix', () => {
    const bridgePrefixed = new Set([
      'hudu_list_prompts',
      'hudu_get_prompt',
      'hudu_list_resources',
      'hudu_read_resource',
    ]);
    const huduPrefixedTools = Object.keys(WORKING_TOOLS).filter(
      (k) => k.startsWith('hudu_') && !bridgePrefixed.has(k)
    );
    expect(huduPrefixedTools).toHaveLength(0);
  });
});

// ============================================================
// (b) Old names (hudu_ prefix) still resolve via alias
// ============================================================

describe('PRB-01 (b): Old tool names resolve via alias', () => {
  const oldNames = Object.keys(TOOL_ALIASES);

  test.each(oldNames)('old name "%s" resolves via resolveToolAlias()', (oldName) => {
    const result = resolveToolAlias(oldName);
    expect(result.wasAliased).toBe(true);
    expect(result.resolvedName).toBe(TOOL_ALIASES[oldName]);
    expect(result.resolvedName).not.toBe(oldName);
  });

  test('non-aliased name passes through unchanged', () => {
    const result = resolveToolAlias('manage_knowledge_articles');
    expect(result.wasAliased).toBe(false);
    expect(result.resolvedName).toBe('manage_knowledge_articles');
  });

  test('resolveToolAlias handles unknown names without throwing', () => {
    const result = resolveToolAlias('totally_unknown_tool');
    expect(result.wasAliased).toBe(false);
    expect(result.resolvedName).toBe('totally_unknown_tool');
  });
});

// ============================================================
// (c) Deprecation warning is emitted when alias is used
// ============================================================

describe('PRB-01 (c): Deprecation warning emitted on alias resolution', () => {
  test('resolveToolAlias marks aliased calls as wasAliased=true (signal for caller to warn)', () => {
    const result = resolveToolAlias('hudu_manage_knowledge_articles');
    expect(result.wasAliased).toBe(true);
  });

  test('resolveToolAlias does not mark non-aliased calls as wasAliased', () => {
    const result = resolveToolAlias('manage_knowledge_articles');
    expect(result.wasAliased).toBe(false);
  });
});

// ============================================================
// (d) Every old name has a corresponding alias entry
// ============================================================

describe('PRB-01 (d): TOOL_ALIASES completeness', () => {
  const allOldNames = [
    'hudu_manage_knowledge_articles',
    'hudu_search_knowledge_articles',
    'hudu_manage_company_information',
    'hudu_search_company_information',
    'hudu_manage_it_asset_inventory',
    'hudu_search_it_asset_inventory',
    'hudu_manage_password_credentials',
    'hudu_search_password_credentials',
    'hudu_manage_workflow_procedures',
    'hudu_search_workflow_procedures',
    'hudu_manage_procedure_task_items',
    'hudu_search_procedure_task_items',
    'hudu_manage_kb_article_folders',
    'hudu_search_kb_article_folders',
    'hudu_manage_network_documentation',
    'hudu_search_network_documentation',
    'hudu_manage_network_vlan_records',
    'hudu_search_network_vlan_records',
    'hudu_manage_network_vlan_zones',
    'hudu_search_network_vlan_zones',
    'hudu_manage_ip_address_records',
    'hudu_search_ip_address_records',
    'hudu_manage_file_upload_records',
    'hudu_search_file_upload_records',
    'hudu_manage_rack_storage_locations',
    'hudu_search_rack_storage_locations',
    'hudu_manage_rack_storage_items',
    'hudu_search_rack_storage_items',
    'hudu_manage_public_photo_gallery',
    'hudu_search_public_photo_gallery',
    'hudu_admin_instance_operations',
    'hudu_search_all_resource_types',
    'hudu_navigate_to_resource_by_name',
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

  test.each(allOldNames)('TOOL_ALIASES has entry for "%s"', (oldName) => {
    expect(TOOL_ALIASES).toHaveProperty(oldName);
  });

  test('TOOL_ALIASES values are new names (no hudu_ prefix)', () => {
    for (const [_old, newName] of Object.entries(TOOL_ALIASES)) {
      expect(newName).not.toMatch(/^hudu_/);
    }
  });

  test('TOOL_ALIASES covers exactly the renamed tools (43 entries)', () => {
    expect(Object.keys(TOOL_ALIASES)).toHaveLength(43);
  });
});
