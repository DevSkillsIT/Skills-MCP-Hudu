import {
  formatCompanyList,
  formatCompanyDetail,
  formatAssetList,
  formatAssetDetail,
  formatArticleList,
  formatArticleDetail,
  formatPasswordList,
  formatPasswordDetail,
  formatProcedureList,
  formatProcedureDetail,
  formatFolderList,
  formatNetworkList,
  formatIpAddressList,
  formatVlanList,
  formatUploadList,
  formatRackStorageList,
  formatRackStorageItemList,
  formatPublicPhotoList,
  formatExpirationList,
  formatWebsiteList,
  formatWebsiteDetail,
  formatAssetLayoutList,
  formatAssetLayoutDetail,
  formatActivityLogList,
  formatRelationList,
  formatRelationDetail,
  formatMagicDashList,
  formatMagicDashDetail,
  toPagedResponse,
} from './markdown.js';

// Tool payloads variam bastante entre CRUD, buscas e utilitarios.
// O formatter central aceita `any` de forma intencional para preservar
// compatibilidade com todos os executors existentes sem refatorar suas assinaturas.
const TOOL_FORMATTERS: Record<string, (data: any, args: any) => string> = {
  // Companies
  'hudu_manage_company_information': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatCompanyList(toPagedResponse(data, args?.page, args?.page_size));
    return formatCompanyDetail(data);
  },
  'hudu_search_company_information': (data, args) =>
    formatCompanyList(toPagedResponse(data, args?.page, args?.page_size)),

  // Articles
  'hudu_manage_knowledge_articles': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatArticleList(toPagedResponse(data, args?.page, args?.page_size));
    return formatArticleDetail(data);
  },
  'hudu_search_knowledge_articles': (data, args) =>
    formatArticleList(toPagedResponse(data, args?.page, args?.page_size)),

  // Assets
  'hudu_manage_it_asset_inventory': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatAssetList(toPagedResponse(data, args?.page, args?.page_size));
    return formatAssetDetail(data);
  },
  'hudu_search_it_asset_inventory': (data, args) =>
    formatAssetList(toPagedResponse(data, args?.page, args?.page_size)),

  // Passwords
  'hudu_manage_password_credentials': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatPasswordList(toPagedResponse(data, args?.page, args?.page_size));
    return formatPasswordDetail(data);
  },
  'hudu_search_password_credentials': (data, args) =>
    formatPasswordList(toPagedResponse(data, args?.page, args?.page_size)),

  // Procedures
  'hudu_manage_workflow_procedures': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatProcedureList(toPagedResponse(data, args?.page, args?.page_size));
    return formatProcedureDetail(data);
  },
  'hudu_search_workflow_procedures': (data, args) =>
    formatProcedureList(toPagedResponse(data, args?.page, args?.page_size)),

  // Procedure Tasks - no dedicated formatter, fallback to JSON
  'hudu_manage_procedure_task_items': (data) => {
    if (!data) return 'Operação realizada com sucesso.';
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_procedure_task_items': (data) => JSON.stringify(data, null, 2),

  // Folders
  'hudu_manage_kb_article_folders': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatFolderList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_kb_article_folders': (data, args) =>
    formatFolderList(toPagedResponse(data, args?.page, args?.page_size)),

  // Networks
  'hudu_manage_network_documentation': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatNetworkList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_network_documentation': (data, args) =>
    formatNetworkList(toPagedResponse(data, args?.page, args?.page_size)),

  // VLANs
  'hudu_manage_network_vlan_records': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatVlanList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_network_vlan_records': (data, args) =>
    formatVlanList(toPagedResponse(data, args?.page, args?.page_size)),

  // VLAN Zones - no dedicated formatter
  'hudu_manage_network_vlan_zones': (data) => {
    if (!data) return 'Operação realizada com sucesso.';
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_network_vlan_zones': (data) => JSON.stringify(data, null, 2),

  // IP Addresses
  'hudu_manage_ip_address_records': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatIpAddressList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_ip_address_records': (data, args) =>
    formatIpAddressList(toPagedResponse(data, args?.page, args?.page_size)),

  // Uploads
  'hudu_manage_file_upload_records': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatUploadList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_file_upload_records': (data, args) =>
    formatUploadList(toPagedResponse(data, args?.page, args?.page_size)),

  // Rack Storage
  'hudu_manage_rack_storage_locations': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatRackStorageList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_rack_storage_locations': (data, args) =>
    formatRackStorageList(toPagedResponse(data, args?.page, args?.page_size)),

  // Rack Items
  'hudu_manage_rack_storage_items': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatRackStorageItemList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_rack_storage_items': (data, args) =>
    formatRackStorageItemList(toPagedResponse(data, args?.page, args?.page_size)),

  // Public Photos
  'hudu_manage_public_photo_gallery': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatPublicPhotoList(toPagedResponse(data, args?.page, args?.page_size));
    return JSON.stringify(data, null, 2);
  },
  'hudu_search_public_photo_gallery': (data, args) =>
    formatPublicPhotoList(toPagedResponse(data, args?.page, args?.page_size)),

  // Admin - variable structure
  'hudu_admin_instance_operations': (data) => JSON.stringify(data, null, 2),

  // Global Search - multi-key object
  'hudu_search_all_resource_types': (data) => JSON.stringify(data, null, 2),

  // Navigation
  'hudu_navigate_to_resource_by_name': (data) => JSON.stringify(data, null, 2),

  // Expirations (Phase 3 tools)
  'hudu_search_expiration_tracking': (data, args) =>
    formatExpirationList(toPagedResponse(data, args?.page, args?.page_size)),

  // Website monitoring (Phase 3 tools)
  'hudu_manage_website_monitoring': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatWebsiteList(toPagedResponse(data, args?.page, args?.page_size));
    return formatWebsiteDetail(data);
  },
  'hudu_search_website_monitoring': (data, args) =>
    formatWebsiteList(toPagedResponse(data, args?.page, args?.page_size)),

  // Asset layout templates (Phase 3 tools)
  'hudu_manage_asset_layout_templates': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatAssetLayoutList(toPagedResponse(data, args?.page, args?.page_size));
    return formatAssetLayoutDetail(data);
  },
  'hudu_search_asset_layout_templates': (data, args) =>
    formatAssetLayoutList(toPagedResponse(data, args?.page, args?.page_size)),

  // Activity / audit logs (Phase 3 tools)
  'hudu_search_activity_audit_logs': (data, args) =>
    formatActivityLogList(toPagedResponse(data, args?.page, args?.page_size)),

  // Relations (Phase 3 tools)
  'hudu_manage_entity_relations': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatRelationList(toPagedResponse(data, args?.page, args?.page_size));
    return formatRelationDetail(data);
  },
  'hudu_search_entity_relations': (data, args) =>
    formatRelationList(toPagedResponse(data, args?.page, args?.page_size)),

  // Dashboard widgets (Phase 3 tools)
  'hudu_manage_dashboard_widgets': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatMagicDashList(toPagedResponse(data, args?.page, args?.page_size));
    return formatMagicDashDetail(data);
  },
  'hudu_search_dashboard_widgets': (data, args) =>
    formatMagicDashList(toPagedResponse(data, args?.page, args?.page_size)),

  // Prompts and Resources as tools (executors already return formatted strings)
  'hudu_list_prompts': (data) => typeof data === 'string' ? data : JSON.stringify(data, null, 2),
  'hudu_get_prompt': (data) => typeof data === 'string' ? data : JSON.stringify(data, null, 2),
  'hudu_list_resources': (data) => typeof data === 'string' ? data : JSON.stringify(data, null, 2),
  'hudu_read_resource': (data) => typeof data === 'string' ? data : JSON.stringify(data, null, 2),
};

/**
 * Converts a tool response to a Markdown-formatted string.
 * Falls back to JSON.stringify for unknown tools or plain strings.
 */
export function formatToolResponse(toolName: string, data: any, args: any): string {
  if (typeof data === 'string') return data;

  // For search/query tools, treat null/undefined as empty array so the
  // formatter can return "Nenhum X encontrado." instead of falling through
  // to the generic success message in server.ts.
  if ((data === null || data === undefined) && toolName.includes('search_')) {
    data = [];
  }

  if (data === null || data === undefined) return '';
  const formatter = TOOL_FORMATTERS[toolName];
  if (formatter) return formatter(data, args ?? {});
  return JSON.stringify(data, null, 2);
}
