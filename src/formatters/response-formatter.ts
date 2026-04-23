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
  formatApiInfo,
  formatExportsList,
  formatGlobalSearchResults,
  formatNavigationResult,
  formatProcedureTaskList,
  formatProcedureTaskDetail,
  formatVlanZoneList,
  formatVlanZoneDetail,
  formatFolderDetail,
  formatNetworkDetail,
  formatIpAddressDetail,
  formatVlanDetail,
  formatUploadDetail,
  formatRackStorageDetail,
  formatRackStorageItemDetail,
  formatPublicPhotoDetail,
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

  // Procedure Tasks
  'hudu_manage_procedure_task_items': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatProcedureTaskList(toPagedResponse(data, args?.page, args?.page_size));
    return formatProcedureTaskDetail(data);
  },
  'hudu_search_procedure_task_items': (data, args) =>
    formatProcedureTaskList(toPagedResponse(data, args?.page, args?.page_size)),

  // Folders
  'hudu_manage_kb_article_folders': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatFolderList(toPagedResponse(data, args?.page, args?.page_size));
    return formatFolderDetail(data);
  },
  'hudu_search_kb_article_folders': (data, args) =>
    formatFolderList(toPagedResponse(data, args?.page, args?.page_size)),

  // Networks
  'hudu_manage_network_documentation': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatNetworkList(toPagedResponse(data, args?.page, args?.page_size));
    return formatNetworkDetail(data);
  },
  'hudu_search_network_documentation': (data, args) =>
    formatNetworkList(toPagedResponse(data, args?.page, args?.page_size)),

  // VLANs
  'hudu_manage_network_vlan_records': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatVlanList(toPagedResponse(data, args?.page, args?.page_size));
    return formatVlanDetail(data);
  },
  'hudu_search_network_vlan_records': (data, args) =>
    formatVlanList(toPagedResponse(data, args?.page, args?.page_size)),

  // VLAN Zones
  'hudu_manage_network_vlan_zones': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatVlanZoneList(toPagedResponse(data, args?.page, args?.page_size));
    return formatVlanZoneDetail(data);
  },
  'hudu_search_network_vlan_zones': (data, args) =>
    formatVlanZoneList(toPagedResponse(data, args?.page, args?.page_size)),

  // IP Addresses
  'hudu_manage_ip_address_records': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatIpAddressList(toPagedResponse(data, args?.page, args?.page_size));
    return formatIpAddressDetail(data);
  },
  'hudu_search_ip_address_records': (data, args) =>
    formatIpAddressList(toPagedResponse(data, args?.page, args?.page_size)),

  // Uploads
  'hudu_manage_file_upload_records': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatUploadList(toPagedResponse(data, args?.page, args?.page_size));
    return formatUploadDetail(data);
  },
  'hudu_search_file_upload_records': (data, args) =>
    formatUploadList(toPagedResponse(data, args?.page, args?.page_size)),

  // Rack Storage
  'hudu_manage_rack_storage_locations': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatRackStorageList(toPagedResponse(data, args?.page, args?.page_size));
    return formatRackStorageDetail(data);
  },
  'hudu_search_rack_storage_locations': (data, args) =>
    formatRackStorageList(toPagedResponse(data, args?.page, args?.page_size)),

  // Rack Items
  'hudu_manage_rack_storage_items': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatRackStorageItemList(toPagedResponse(data, args?.page, args?.page_size));
    return formatRackStorageItemDetail(data);
  },
  'hudu_search_rack_storage_items': (data, args) =>
    formatRackStorageItemList(toPagedResponse(data, args?.page, args?.page_size)),

  // Public Photos
  'hudu_manage_public_photo_gallery': (data, args) => {
    if (!data) return 'Operação realizada com sucesso.';
    if (Array.isArray(data))
      return formatPublicPhotoList(toPagedResponse(data, args?.page, args?.page_size));
    return formatPublicPhotoDetail(data);
  },
  'hudu_search_public_photo_gallery': (data, args) =>
    formatPublicPhotoList(toPagedResponse(data, args?.page, args?.page_size)),

  // Admin — dispatch per action because each sub-command returns a different
  // shape (api_info object, activity_logs array, exports array, expirations array).
  // Handlers tolerate undefined/null so empty API payloads produce a friendly
  // "Nenhum X encontrado." instead of leaking the raw success message.
  'hudu_admin_instance_operations': (data, args) => {
    const action = args?.action;
    const arr = Array.isArray(data) ? data : [];
    switch (action) {
      case 'get_api_info':
        return data ? formatApiInfo(data) : 'Informações da API indisponíveis.';
      case 'get_activity_logs':
        return formatActivityLogList(toPagedResponse(arr, args?.page, args?.page_size));
      case 'get_exports':
        return formatExportsList(data, 'standard');
      case 'get_s3_exports':
        return formatExportsList(data, 's3');
      case 'get_expirations':
        return formatExpirationList(toPagedResponse(arr, args?.page, args?.page_size));
      case 'delete_activity_logs':
        return 'Logs de atividade excluídos com sucesso.';
      default:
        return data ? JSON.stringify(data, null, 2) : 'Operação realizada com sucesso.';
    }
  },

  // Global Search — multi-key object aggregated across articles/assets/passwords/companies.
  'hudu_search_all_resource_types': (data, args) =>
    formatGlobalSearchResults(data, args?.query),

  // Navigation — structured by executeNavigationTool as { action, query, results }.
  'hudu_navigate_to_resource_by_name': (data) => formatNavigationResult(data),

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

  const formatter = TOOL_FORMATTERS[toolName];
  // Let the formatter decide what to render for null/undefined — the admin
  // tool, for example, maps {action: 'get_exports', data: undefined} to
  // "Nenhuma exportação encontrada." instead of leaking the raw API message.
  if (formatter) return formatter(data, args ?? {});

  if (data === null || data === undefined) return '';
  return JSON.stringify(data, null, 2);
}
