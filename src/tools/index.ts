// Export all consolidated tools and their execution functions
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
// NEW: Export folders tools
export {
  foldersTool,
  foldersQueryTool,
  executeFoldersTool,
  executeFoldersQueryTool
} from './folders.js';
export { adminTool, executeAdminTool } from './admin.js';
export { searchTool, executeSearchTool } from './search.js';
export { navigationTool, executeNavigationTool } from './navigation.js';
export { createErrorResponse, createSuccessResponse, type ToolResponse, type ToolExecutor } from './base.js';

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolExecutor } from './base.js';

// Import tools for registry
import { articlesTool, articlesQueryTool } from './articles.js';
import { companiesTool, companiesQueryTool } from './companies.js';
import { assetsTool, assetsQueryTool } from './assets.js';
import { passwordsTool, passwordsQueryTool } from './passwords.js';
import { proceduresTool, proceduresQueryTool, procedureTasksTool, procedureTasksQueryTool } from './procedures.js';
import {
  networksTool, networksQueryTool,
  vlansTool, vlansQueryTool,
  vlanZonesTool, vlanZonesQueryTool,
  ipAddressesTool, ipAddressesQueryTool
} from './networks.js';
import {
  uploadsTool, uploadsQueryTool,
  rackStoragesTool, rackStoragesQueryTool,
  rackStorageItemsTool, rackStorageItemsQueryTool,
  publicPhotosTool, publicPhotosQueryTool
} from './storage.js';
import { foldersTool, foldersQueryTool } from './folders.js';
import { adminTool } from './admin.js';
import { searchTool } from './search.js';
import { navigationTool } from './navigation.js';

// Import executors
import { executeArticlesTool, executeArticlesQueryTool } from './articles.js';
import { executeCompaniesTool, executeCompaniesQueryTool } from './companies.js';
import { executeAssetsTool, executeAssetsQueryTool } from './assets.js';
import { executePasswordsTool, executePasswordsQueryTool } from './passwords.js';
import {
  executeProceduresTool, executeProceduresQueryTool,
  executeProcedureTasksTool, executeProcedureTasksQueryTool
} from './procedures.js';
import {
  executeNetworksTool, executeNetworksQueryTool,
  executeVlansTool, executeVlansQueryTool,
  executeVlanZonesTool, executeVlanZonesQueryTool,
  executeIpAddressesTool, executeIpAddressesQueryTool
} from './networks.js';
import {
  executeUploadsTool, executeUploadsQueryTool,
  executeRackStoragesTool, executeRackStoragesQueryTool,
  executeRackStorageItemsTool, executeRackStorageItemsQueryTool,
  executePublicPhotosTool, executePublicPhotosQueryTool
} from './storage.js';
import { executeFoldersTool, executeFoldersQueryTool } from './folders.js';
import { executeAdminTool } from './admin.js';
import { executeSearchTool } from './search.js';
import { executeNavigationTool } from './navigation.js';

// Consolidated tool registry - maps tool names to their definitions
export const CONSOLIDATED_TOOLS: Record<string, Tool> = {
  // Core resources
  'manage_knowledge_articles': articlesTool,
  'search_knowledge_articles': articlesQueryTool,
  'manage_company_information': companiesTool,
  'search_company_information': companiesQueryTool,
  'manage_it_asset_inventory': assetsTool,
  'search_it_asset_inventory': assetsQueryTool,
  'manage_password_credentials': passwordsTool,
  'search_password_credentials': passwordsQueryTool,

  // Specialized resources
  'manage_workflow_procedures': proceduresTool,
  'search_workflow_procedures': proceduresQueryTool,
  'manage_procedure_task_items': procedureTasksTool,
  'search_procedure_task_items': procedureTasksQueryTool,

  // Network resources
  'manage_network_documentation': networksTool,
  'search_network_documentation': networksQueryTool,
  'manage_network_vlan_records': vlansTool,
  'search_network_vlan_records': vlansQueryTool,
  'manage_network_vlan_zones': vlanZonesTool,
  'search_network_vlan_zones': vlanZonesQueryTool,
  'manage_ip_address_records': ipAddressesTool,
  'search_ip_address_records': ipAddressesQueryTool,

  // Storage resources
  'manage_file_upload_records': uploadsTool,
  'search_file_upload_records': uploadsQueryTool,
  'manage_rack_storage_locations': rackStoragesTool,
  'search_rack_storage_locations': rackStoragesQueryTool,
  'manage_rack_storage_items': rackStorageItemsTool,
  'search_rack_storage_items': rackStorageItemsQueryTool,
  'manage_public_photo_gallery': publicPhotosTool,
  'search_public_photo_gallery': publicPhotosQueryTool,

  // Folders resources
  'manage_kb_article_folders': foldersTool,
  'search_kb_article_folders': foldersQueryTool,

  // Utility tools
  'admin_instance_operations': adminTool,
  'search_all_resource_types': searchTool,
  'navigate_to_resource_by_name': navigationTool
};

// Tool execution function registry
export const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  // Core resources
  'manage_knowledge_articles': executeArticlesTool,
  'search_knowledge_articles': executeArticlesQueryTool,
  'manage_company_information': executeCompaniesTool,
  'search_company_information': executeCompaniesQueryTool,
  'manage_it_asset_inventory': executeAssetsTool,
  'search_it_asset_inventory': executeAssetsQueryTool,
  'manage_password_credentials': executePasswordsTool,
  'search_password_credentials': executePasswordsQueryTool,

  // Specialized resources
  'manage_workflow_procedures': executeProceduresTool,
  'search_workflow_procedures': executeProceduresQueryTool,
  'manage_procedure_task_items': executeProcedureTasksTool,
  'search_procedure_task_items': executeProcedureTasksQueryTool,

  // Network resources
  'manage_network_documentation': executeNetworksTool,
  'search_network_documentation': executeNetworksQueryTool,
  'manage_network_vlan_records': executeVlansTool,
  'search_network_vlan_records': executeVlansQueryTool,
  'manage_network_vlan_zones': executeVlanZonesTool,
  'search_network_vlan_zones': executeVlanZonesQueryTool,
  'manage_ip_address_records': executeIpAddressesTool,
  'search_ip_address_records': executeIpAddressesQueryTool,

  // Storage resources
  'manage_file_upload_records': executeUploadsTool,
  'search_file_upload_records': executeUploadsQueryTool,
  'manage_rack_storage_locations': executeRackStoragesTool,
  'search_rack_storage_locations': executeRackStoragesQueryTool,
  'manage_rack_storage_items': executeRackStorageItemsTool,
  'search_rack_storage_items': executeRackStorageItemsQueryTool,
  'manage_public_photo_gallery': executePublicPhotosTool,
  'search_public_photo_gallery': executePublicPhotosQueryTool,

  // Folders resources
  'manage_kb_article_folders': executeFoldersTool,
  'search_kb_article_folders': executeFoldersQueryTool,

  // Utility tools
  'admin_instance_operations': executeAdminTool,
  'search_all_resource_types': executeSearchTool,
  'navigate_to_resource_by_name': executeNavigationTool
};
