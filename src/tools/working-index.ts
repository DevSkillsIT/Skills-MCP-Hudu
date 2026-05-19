// Working consolidated tools - fully implemented
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

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
export { createErrorResponse, createSuccessResponse, type ToolResponse, type ToolExecutor } from './base.js';

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
import {
  expirationsTool, executeExpirationsTool
} from './expirations.js';
import {
  websitesTool, websitesQueryTool, executeWebsitesTool, executeWebsitesQueryTool
} from './websites.js';
import {
  assetLayoutsTool, assetLayoutsQueryTool, executeAssetLayoutsTool, executeAssetLayoutsQueryTool
} from './asset-layouts.js';
import {
  activityLogsTool, executeActivityLogsTool
} from './activity-logs.js';
import {
  relationsTool, relationsQueryTool, executeRelationsTool, executeRelationsQueryTool
} from './relations.js';
import {
  magicDashTool, magicDashQueryTool, executeMagicDashTool, executeMagicDashQueryTool
} from './magic-dash.js';
import {
  listPromptsTool, getPromptTool, executeListPromptsTool, executeGetPromptTool
} from './prompt-tools.js';
import {
  listResourcesTool, readResourceTool, executeListResourcesTool, executeReadResourceTool
} from './resource-tools.js';
import type { ToolExecutor } from './base.js';

// Working tool registry
export const WORKING_TOOLS: Record<string, Tool> = {
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

  // Folders
  'manage_kb_article_folders': foldersTool,
  'search_kb_article_folders': foldersQueryTool,

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

  // Utility tools
  'admin_instance_operations': adminTool,
  'search_all_resource_types': searchTool,
  'navigate_to_resource_by_name': navigationTool,

  // Expirations
  'search_expiration_tracking': expirationsTool,
  // Websites
  'manage_website_monitoring': websitesTool,
  'search_website_monitoring': websitesQueryTool,
  // Asset Layouts
  'manage_asset_layout_templates': assetLayoutsTool,
  'search_asset_layout_templates': assetLayoutsQueryTool,
  // Activity Logs
  'search_activity_audit_logs': activityLogsTool,
  // Relations
  'manage_entity_relations': relationsTool,
  'search_entity_relations': relationsQueryTool,
  // Magic Dash
  'manage_dashboard_widgets': magicDashTool,
  'search_dashboard_widgets': magicDashQueryTool,
  // Prompts as tools (MCPHub bridge — retain hudu_ prefix, part of bridge interface)
  'hudu_list_prompts': listPromptsTool,
  'hudu_get_prompt': getPromptTool,
  // Resources as tools (MCPHub bridge — retain hudu_ prefix, part of bridge interface)
  'hudu_list_resources': listResourcesTool,
  'hudu_read_resource': readResourceTool,
};

// Working tool executors
export const WORKING_TOOL_EXECUTORS: Record<string, ToolExecutor> = {
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

  // Folders
  'manage_kb_article_folders': executeFoldersTool,
  'search_kb_article_folders': executeFoldersQueryTool,

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

  // Utility tools
  'admin_instance_operations': executeAdminTool,
  'search_all_resource_types': executeSearchTool,
  'navigate_to_resource_by_name': executeNavigationTool,

  // Expirations
  'search_expiration_tracking': executeExpirationsTool,
  // Websites
  'manage_website_monitoring': executeWebsitesTool,
  'search_website_monitoring': executeWebsitesQueryTool,
  // Asset Layouts
  'manage_asset_layout_templates': executeAssetLayoutsTool,
  'search_asset_layout_templates': executeAssetLayoutsQueryTool,
  // Activity Logs
  'search_activity_audit_logs': executeActivityLogsTool,
  // Relations
  'manage_entity_relations': executeRelationsTool,
  'search_entity_relations': executeRelationsQueryTool,
  // Magic Dash
  'manage_dashboard_widgets': executeMagicDashTool,
  'search_dashboard_widgets': executeMagicDashQueryTool,
  // Prompts as tools (MCPHub bridge — retain hudu_ prefix, part of bridge interface)
  'hudu_list_prompts': executeListPromptsTool,
  'hudu_get_prompt': executeGetPromptTool,
  // Resources as tools (MCPHub bridge — retain hudu_ prefix, part of bridge interface)
  'hudu_list_resources': executeListResourcesTool,
  'hudu_read_resource': executeReadResourceTool,
};
