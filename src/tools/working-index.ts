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
  'articles': articlesTool,
  'articles_query': articlesQueryTool,
  'companies': companiesTool,
  'companies_query': companiesQueryTool,
  'assets': assetsTool,
  'assets_query': assetsQueryTool,
  'passwords': passwordsTool,
  'passwords_query': passwordsQueryTool,
  
  // Specialized resources
  'procedures': proceduresTool,
  'procedures_query': proceduresQueryTool,
  'procedure_tasks': procedureTasksTool,
  'procedure_tasks_query': procedureTasksQueryTool,
  

  // Folders
  'folders': foldersTool,
  'folders_query': foldersQueryTool,
  // Network resources
  'networks': networksTool,
  'networks_query': networksQueryTool,
  'vlans': vlansTool,
  'vlans_query': vlansQueryTool,
  'vlan_zones': vlanZonesTool,
  'vlan_zones_query': vlanZonesQueryTool,
  'ip_addresses': ipAddressesTool,
  'ip_addresses_query': ipAddressesQueryTool,
  
  // Storage resources
  'uploads': uploadsTool,
  'uploads_query': uploadsQueryTool,
  'rack_storages': rackStoragesTool,
  'rack_storages_query': rackStoragesQueryTool,
  'rack_storage_items': rackStorageItemsTool,
  'rack_storage_items_query': rackStorageItemsQueryTool,
  'public_photos': publicPhotosTool,
  'public_photos_query': publicPhotosQueryTool,
  
  // Utility tools
  'admin': adminTool,
  'search': searchTool,
  'navigation': navigationTool
};

// Working tool executors
export const WORKING_TOOL_EXECUTORS: Record<string, Function> = {
  // Core resources
  'articles': executeArticlesTool,
  'articles_query': executeArticlesQueryTool,
  'companies': executeCompaniesTool,
  'companies_query': executeCompaniesQueryTool,
  'assets': executeAssetsTool,
  'assets_query': executeAssetsQueryTool,
  'passwords': executePasswordsTool,
  'passwords_query': executePasswordsQueryTool,
  
  // Specialized resources
  'procedures': executeProceduresTool,
  'procedures_query': executeProceduresQueryTool,
  'procedure_tasks': executeProcedureTasksTool,
  'procedure_tasks_query': executeProcedureTasksQueryTool,
  

  // Folders
  'folders': executeFoldersTool,
  'folders_query': executeFoldersQueryTool,
  // Network resources
  'networks': executeNetworksTool,
  'networks_query': executeNetworksQueryTool,
  'vlans': executeVlansTool,
  'vlans_query': executeVlansQueryTool,
  'vlan_zones': executeVlanZonesTool,
  'vlan_zones_query': executeVlanZonesQueryTool,
  'ip_addresses': executeIpAddressesTool,
  'ip_addresses_query': executeIpAddressesQueryTool,
  
  // Storage resources
  'uploads': executeUploadsTool,
  'uploads_query': executeUploadsQueryTool,
  'rack_storages': executeRackStoragesTool,
  'rack_storages_query': executeRackStoragesQueryTool,
  'rack_storage_items': executeRackStorageItemsTool,
  'rack_storage_items_query': executeRackStorageItemsQueryTool,
  'public_photos': executePublicPhotosTool,
  'public_photos_query': executePublicPhotosQueryTool,
  
  // Utility tools
  'admin': executeAdminTool,
  'search': executeSearchTool,
  'navigation': executeNavigationTool
};