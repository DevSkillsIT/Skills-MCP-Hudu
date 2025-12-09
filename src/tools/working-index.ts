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
  'articles.query': articlesQueryTool,
  'companies': companiesTool,
  'companies.query': companiesQueryTool,
  'assets': assetsTool,
  'assets.query': assetsQueryTool,
  'passwords': passwordsTool,
  'passwords.query': passwordsQueryTool,
  
  // Specialized resources
  'procedures': proceduresTool,
  'procedures.query': proceduresQueryTool,
  'procedure_tasks': procedureTasksTool,
  'procedure_tasks.query': procedureTasksQueryTool,
  

  // Folders
  'folders': foldersTool,
  'folders.query': foldersQueryTool,
  // Network resources
  'networks': networksTool,
  'networks.query': networksQueryTool,
  'vlans': vlansTool,
  'vlans.query': vlansQueryTool,
  'vlan_zones': vlanZonesTool,
  'vlan_zones.query': vlanZonesQueryTool,
  'ip_addresses': ipAddressesTool,
  'ip_addresses.query': ipAddressesQueryTool,
  
  // Storage resources
  'uploads': uploadsTool,
  'uploads.query': uploadsQueryTool,
  'rack_storages': rackStoragesTool,
  'rack_storages.query': rackStoragesQueryTool,
  'rack_storage_items': rackStorageItemsTool,
  'rack_storage_items.query': rackStorageItemsQueryTool,
  'public_photos': publicPhotosTool,
  'public_photos.query': publicPhotosQueryTool,
  
  // Utility tools
  'admin': adminTool,
  'search': searchTool,
  'navigation': navigationTool
};

// Working tool executors
export const WORKING_TOOL_EXECUTORS: Record<string, Function> = {
  // Core resources
  'articles': executeArticlesTool,
  'articles.query': executeArticlesQueryTool,
  'companies': executeCompaniesTool,
  'companies.query': executeCompaniesQueryTool,
  'assets': executeAssetsTool,
  'assets.query': executeAssetsQueryTool,
  'passwords': executePasswordsTool,
  'passwords.query': executePasswordsQueryTool,
  
  // Specialized resources
  'procedures': executeProceduresTool,
  'procedures.query': executeProceduresQueryTool,
  'procedure_tasks': executeProcedureTasksTool,
  'procedure_tasks.query': executeProcedureTasksQueryTool,
  

  // Folders
  'folders': executeFoldersTool,
  'folders.query': executeFoldersQueryTool,
  // Network resources
  'networks': executeNetworksTool,
  'networks.query': executeNetworksQueryTool,
  'vlans': executeVlansTool,
  'vlans.query': executeVlansQueryTool,
  'vlan_zones': executeVlanZonesTool,
  'vlan_zones.query': executeVlanZonesQueryTool,
  'ip_addresses': executeIpAddressesTool,
  'ip_addresses.query': executeIpAddressesQueryTool,
  
  // Storage resources
  'uploads': executeUploadsTool,
  'uploads.query': executeUploadsQueryTool,
  'rack_storages': executeRackStoragesTool,
  'rack_storages.query': executeRackStoragesQueryTool,
  'rack_storage_items': executeRackStorageItemsTool,
  'rack_storage_items.query': executeRackStorageItemsQueryTool,
  'public_photos': executePublicPhotosTool,
  'public_photos.query': executePublicPhotosQueryTool,
  
  // Utility tools
  'admin': executeAdminTool,
  'search': executeSearchTool,
  'navigation': executeNavigationTool
};