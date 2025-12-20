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
export { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

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

  // NEW: Folders resources
  'folders': foldersTool,
  'folders_query': foldersQueryTool,

  // Utility tools
  'admin': adminTool,
  'search': searchTool,
  'navigation': navigationTool
};

// Tool execution function registry
export const TOOL_EXECUTORS: Record<string, Function> = {
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

  // NEW: Folders resources
  'folders': executeFoldersTool,
  'folders_query': executeFoldersQueryTool,

  // Utility tools
  'admin': executeAdminTool,
  'search': executeSearchTool,
  'navigation': executeNavigationTool
};
