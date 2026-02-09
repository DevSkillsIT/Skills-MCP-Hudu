// Working consolidated tools - fully implemented
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HuduClient } from '../hudu-client.js';

// Re-export from working tool files
export { articlesTool, articlesQueryTool, executeArticlesTool, executeArticlesQueryTool } from './articles.js';
export { companiesTool, companiesQueryTool, executeCompaniesTool, executeCompaniesQueryTool } from './companies.js';
export { assetsTool, assetsQueryTool, executeAssetsTool, executeAssetsQueryTool } from './assets.js';
export { passwordsTool, passwordsQueryTool, executePasswordsTool, executePasswordsQueryTool } from './passwords.js';
export { 
  proceduresTool, 
  proceduresQueryTool, 
  procedureTasksTool, 
  procedureTasksQueryTool,
  executeProceduresTool, 
  executeProceduresQueryTool,
  executeProcedureTasksTool,
  executeProcedureTasksQueryTool
} from './procedures.js';
export {
  networksTool,
  networksQueryTool,
  vlansTool,
  vlansQueryTool,
  vlanZonesTool,
  vlanZonesQueryTool,
  ipAddressesTool,
  ipAddressesQueryTool,
  executeNetworksTool,
  executeNetworksQueryTool,
  executeVlansTool,
  executeVlansQueryTool,
  executeVlanZonesTool,
  executeVlanZonesQueryTool,
  executeIpAddressesTool,
  executeIpAddressesQueryTool
} from './networks.js';
export {
  uploadsTool,
  uploadsQueryTool,
  rackStoragesTool,
  rackStoragesQueryTool,
  rackStorageItemsTool,
  rackStorageItemsQueryTool,
  publicPhotosTool,
  publicPhotosQueryTool,
  executeUploadsTool,
  executeUploadsQueryTool,
  executeRackStoragesTool,
  executeRackStoragesQueryTool,
  executeRackStorageItemsTool,
  executeRackStorageItemsQueryTool,
  executePublicPhotosTool,
  executePublicPhotosQueryTool
} from './storage.js';
export { adminTool, executeAdminTool } from './admin.js';
export { searchTool, executeSearchTool } from './search.js';
export { navigationTool, executeNavigationTool } from './navigation.js';
export { foldersTool, foldersQueryTool, executeFoldersTool, executeFoldersQueryTool } from './folders.js';
export { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';

import { 
  articlesTool, articlesQueryTool, executeArticlesTool, executeArticlesQueryTool 
} from './articles.js';
import { 
  companiesTool, companiesQueryTool, executeCompaniesTool, executeCompaniesQueryTool 
} from './companies.js';
import { 
  assetsTool, assetsQueryTool, executeAssetsTool, executeAssetsQueryTool 
} from './assets.js';
import { 
  passwordsTool, passwordsQueryTool, executePasswordsTool, executePasswordsQueryTool 
} from './passwords.js';
import { 
  proceduresTool, proceduresQueryTool, procedureTasksTool, procedureTasksQueryTool,
  executeProceduresTool, executeProceduresQueryTool, executeProcedureTasksTool, executeProcedureTasksQueryTool
} from './procedures.js';
import {
  networksTool,
  networksQueryTool,
  vlansTool,
  vlansQueryTool,
  vlanZonesTool,
  vlanZonesQueryTool,
  ipAddressesTool,
  ipAddressesQueryTool,
  executeNetworksTool,
  executeNetworksQueryTool,
  executeVlansTool,
  executeVlansQueryTool,
  executeVlanZonesTool,
  executeVlanZonesQueryTool,
  executeIpAddressesTool,
  executeIpAddressesQueryTool
} from './networks.js';
import {
  uploadsTool,
  uploadsQueryTool,
  rackStoragesTool,
  rackStoragesQueryTool,
  rackStorageItemsTool,
  rackStorageItemsQueryTool,
  publicPhotosTool,
  publicPhotosQueryTool,
  executeUploadsTool,
  executeUploadsQueryTool,
  executeRackStoragesTool,
  executeRackStoragesQueryTool,
  executeRackStorageItemsTool,
  executeRackStorageItemsQueryTool,
  executePublicPhotosTool,
  executePublicPhotosQueryTool
} from './storage.js';
import { adminTool, executeAdminTool } from './admin.js';
import { searchTool, executeSearchTool } from './search.js';
import { navigationTool, executeNavigationTool } from './navigation.js';
import { foldersTool, foldersQueryTool, executeFoldersTool, executeFoldersQueryTool } from './folders.js';

// Working tool registry
export const WORKING_TOOLS: Record<string, Tool> = {
  // Core resources
  'hudu_manage_knowledge_articles': articlesTool,
  'hudu_search_knowledge_articles': articlesQueryTool,
  'hudu_manage_company_information': companiesTool,
  'hudu_search_company_information': companiesQueryTool,
  'hudu_manage_it_asset_inventory': assetsTool,
  'hudu_search_it_asset_inventory': assetsQueryTool,
  'hudu_manage_password_credentials': passwordsTool,
  'hudu_search_password_credentials': passwordsQueryTool,

  // Specialized resources
  'hudu_manage_workflow_procedures': proceduresTool,
  'hudu_search_workflow_procedures': proceduresQueryTool,
  'hudu_manage_procedure_task_items': procedureTasksTool,
  'hudu_search_procedure_task_items': procedureTasksQueryTool,

  // Folders
  'hudu_manage_kb_article_folders': foldersTool,
  'hudu_search_kb_article_folders': foldersQueryTool,

  // Network resources
  'hudu_manage_network_documentation': networksTool,
  'hudu_search_network_documentation': networksQueryTool,
  'hudu_manage_network_vlan_records': vlansTool,
  'hudu_search_network_vlan_records': vlansQueryTool,
  'hudu_manage_network_vlan_zones': vlanZonesTool,
  'hudu_search_network_vlan_zones': vlanZonesQueryTool,
  'hudu_manage_ip_address_records': ipAddressesTool,
  'hudu_search_ip_address_records': ipAddressesQueryTool,

  // Storage resources
  'hudu_manage_file_upload_records': uploadsTool,
  'hudu_search_file_upload_records': uploadsQueryTool,
  'hudu_manage_rack_storage_locations': rackStoragesTool,
  'hudu_search_rack_storage_locations': rackStoragesQueryTool,
  'hudu_manage_rack_storage_items': rackStorageItemsTool,
  'hudu_search_rack_storage_items': rackStorageItemsQueryTool,
  'hudu_manage_public_photo_gallery': publicPhotosTool,
  'hudu_search_public_photo_gallery': publicPhotosQueryTool,

  // Utility tools
  'hudu_admin_instance_operations': adminTool,
  'hudu_search_all_resource_types': searchTool,
  'hudu_navigate_to_resource_by_name': navigationTool
};

// Working tool executors
export const WORKING_TOOL_EXECUTORS: Record<string, Function> = {
  // Core resources
  'hudu_manage_knowledge_articles': executeArticlesTool,
  'hudu_search_knowledge_articles': executeArticlesQueryTool,
  'hudu_manage_company_information': executeCompaniesTool,
  'hudu_search_company_information': executeCompaniesQueryTool,
  'hudu_manage_it_asset_inventory': executeAssetsTool,
  'hudu_search_it_asset_inventory': executeAssetsQueryTool,
  'hudu_manage_password_credentials': executePasswordsTool,
  'hudu_search_password_credentials': executePasswordsQueryTool,

  // Specialized resources
  'hudu_manage_workflow_procedures': executeProceduresTool,
  'hudu_search_workflow_procedures': executeProceduresQueryTool,
  'hudu_manage_procedure_task_items': executeProcedureTasksTool,
  'hudu_search_procedure_task_items': executeProcedureTasksQueryTool,

  // Folders
  'hudu_manage_kb_article_folders': executeFoldersTool,
  'hudu_search_kb_article_folders': executeFoldersQueryTool,

  // Network resources
  'hudu_manage_network_documentation': executeNetworksTool,
  'hudu_search_network_documentation': executeNetworksQueryTool,
  'hudu_manage_network_vlan_records': executeVlansTool,
  'hudu_search_network_vlan_records': executeVlansQueryTool,
  'hudu_manage_network_vlan_zones': executeVlanZonesTool,
  'hudu_search_network_vlan_zones': executeVlanZonesQueryTool,
  'hudu_manage_ip_address_records': executeIpAddressesTool,
  'hudu_search_ip_address_records': executeIpAddressesQueryTool,

  // Storage resources
  'hudu_manage_file_upload_records': executeUploadsTool,
  'hudu_search_file_upload_records': executeUploadsQueryTool,
  'hudu_manage_rack_storage_locations': executeRackStoragesTool,
  'hudu_search_rack_storage_locations': executeRackStoragesQueryTool,
  'hudu_manage_rack_storage_items': executeRackStorageItemsTool,
  'hudu_search_rack_storage_items': executeRackStorageItemsQueryTool,
  'hudu_manage_public_photo_gallery': executePublicPhotosTool,
  'hudu_search_public_photo_gallery': executePublicPhotosQueryTool,

  // Utility tools
  'hudu_admin_instance_operations': executeAdminTool,
  'hudu_search_all_resource_types': executeSearchTool,
  'hudu_navigate_to_resource_by_name': executeNavigationTool
};