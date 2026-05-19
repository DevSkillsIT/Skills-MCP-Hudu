/**
 * Tool name alias resolution for backward compatibility.
 *
 * Background: All tools previously used a `hudu_` prefix (e.g. `hudu_manage_knowledge_articles`).
 * MCPHub aggregator adds its own server prefix, resulting in double-prefix like
 * `hudu-hudu_manage_knowledge_articles`. To fix this, tools are now registered
 * without the `hudu_` prefix. Old names are supported via this alias map for one
 * minor version of backward compatibility.
 *
 * // @MX:WARN: Deprecated alias resolution — remove in v2.x.0
 * // @MX:REASON: Backward-compat shim for MCPHub clients still using old hudu_ prefixed names
 */

export const TOOL_ALIASES: Record<string, string> = {
  // Core resources
  'hudu_manage_knowledge_articles': 'manage_knowledge_articles',
  'hudu_search_knowledge_articles': 'search_knowledge_articles',
  'hudu_manage_company_information': 'manage_company_information',
  'hudu_search_company_information': 'search_company_information',
  'hudu_manage_it_asset_inventory': 'manage_it_asset_inventory',
  'hudu_search_it_asset_inventory': 'search_it_asset_inventory',
  'hudu_manage_password_credentials': 'manage_password_credentials',
  'hudu_search_password_credentials': 'search_password_credentials',

  // Procedures
  'hudu_manage_workflow_procedures': 'manage_workflow_procedures',
  'hudu_search_workflow_procedures': 'search_workflow_procedures',
  'hudu_manage_procedure_task_items': 'manage_procedure_task_items',
  'hudu_search_procedure_task_items': 'search_procedure_task_items',

  // Folders
  'hudu_manage_kb_article_folders': 'manage_kb_article_folders',
  'hudu_search_kb_article_folders': 'search_kb_article_folders',

  // Network resources
  'hudu_manage_network_documentation': 'manage_network_documentation',
  'hudu_search_network_documentation': 'search_network_documentation',
  'hudu_manage_network_vlan_records': 'manage_network_vlan_records',
  'hudu_search_network_vlan_records': 'search_network_vlan_records',
  'hudu_manage_network_vlan_zones': 'manage_network_vlan_zones',
  'hudu_search_network_vlan_zones': 'search_network_vlan_zones',
  'hudu_manage_ip_address_records': 'manage_ip_address_records',
  'hudu_search_ip_address_records': 'search_ip_address_records',

  // Storage resources
  'hudu_manage_file_upload_records': 'manage_file_upload_records',
  'hudu_search_file_upload_records': 'search_file_upload_records',
  'hudu_manage_rack_storage_locations': 'manage_rack_storage_locations',
  'hudu_search_rack_storage_locations': 'search_rack_storage_locations',
  'hudu_manage_rack_storage_items': 'manage_rack_storage_items',
  'hudu_search_rack_storage_items': 'search_rack_storage_items',
  'hudu_manage_public_photo_gallery': 'manage_public_photo_gallery',
  'hudu_search_public_photo_gallery': 'search_public_photo_gallery',

  // Utility tools
  'hudu_admin_instance_operations': 'admin_instance_operations',
  'hudu_search_all_resource_types': 'search_all_resource_types',
  'hudu_navigate_to_resource_by_name': 'navigate_to_resource_by_name',

  // Expirations
  'hudu_search_expiration_tracking': 'search_expiration_tracking',

  // Websites
  'hudu_manage_website_monitoring': 'manage_website_monitoring',
  'hudu_search_website_monitoring': 'search_website_monitoring',

  // Asset layouts
  'hudu_manage_asset_layout_templates': 'manage_asset_layout_templates',
  'hudu_search_asset_layout_templates': 'search_asset_layout_templates',

  // Activity logs
  'hudu_search_activity_audit_logs': 'search_activity_audit_logs',

  // Relations
  'hudu_manage_entity_relations': 'manage_entity_relations',
  'hudu_search_entity_relations': 'search_entity_relations',

  // Magic Dash / Dashboard
  'hudu_manage_dashboard_widgets': 'manage_dashboard_widgets',
  'hudu_search_dashboard_widgets': 'search_dashboard_widgets',

  // NOTE: Bridge tools (hudu_list_prompts, hudu_get_prompt, hudu_list_resources,
  // hudu_read_resource) are NOT included here — they retain their hudu_ prefix
  // because they are part of the MCPHub bridge interface.
};

/**
 * Resolve a potentially deprecated tool name to its current name.
 *
 * @returns resolvedName - the current tool name to dispatch
 * @returns wasAliased - true when the input was a deprecated alias.
 *   Callers should emit a deprecation warning when wasAliased is true.
 */
export function resolveToolAlias(name: string): { resolvedName: string; wasAliased: boolean } {
  const resolved = TOOL_ALIASES[name];
  if (resolved !== undefined) {
    return { resolvedName: resolved, wasAliased: true };
  }
  return { resolvedName: name, wasAliased: false };
}
