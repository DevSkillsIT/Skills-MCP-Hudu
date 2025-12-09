import { z } from 'zod';

// Hudu API Configuration
export const HuduConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
  timeout: z.number().optional().default(30000),
});

export type HuduConfig = z.infer<typeof HuduConfigSchema>;

// Common Hudu API Response Structure
export interface HuduApiResponse<T> {
  data: T;
  meta?: {
    current_page?: number;
    total_pages?: number;
    total_count?: number;
    per_page?: number;
  };
}

// Core Hudu Entity Types
export interface HuduArticle {
  id: number;
  name: string;
  content: string;
  slug: string;
  company_id?: number;
  folder_id?: number;
  archived: boolean;
  enable_sharing: boolean;
  created_at: string;
  updated_at: string;
}

export interface HuduAsset {
  id: number;
  name: string;
  asset_type: string;
  company_id: number;
  asset_layout_id: number;
  slug: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  fields: Array<{
    label: string;
    value: any;
    field_type: string;
  }>;
}

export interface HuduAssetPassword {
  id: number;
  name: string;
  username?: string;
  password: string;
  url?: string;
  description?: string;
  company_id?: number;
  passwordable_type?: string;
  passwordable_id?: number;
  password_type?: string;
  in_portal: boolean;
  created_at: string;
  updated_at: string;
}

export interface HuduCompany {
  id: number;
  name: string;
  nickname?: string;
  company_type?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country_name?: string;
  phone_number?: string;
  fax_number?: string;
  website?: string;
  id_number?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HuduAssetLayout {
  id: number;
  name: string;
  icon: string;
  color: string;
  icon_color: string;
  active: boolean;
  include_passwords: boolean;
  include_photos: boolean;
  include_comments: boolean;
  include_files: boolean;
  fields: Array<{
    id?: number;
    label: string;
    field_type: string;
    required: boolean;
    show_in_list: boolean;
    position: number;
    options?: string[];
  }>;
}

export interface HuduActivityLog {
  id: number;
  user_id?: number;
  user_email?: string;
  resource_id: number;
  resource_type: string;
  action_message: string;
  created_at: string;
}

export interface HuduFolder {
  id: number;
  name: string;
  icon: string;
  description?: string;
  parent_folder_id?: number;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  admin: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HuduProcedure {
  id: number;
  name: string;
  description?: string;
  company_id?: number;
  folder_id?: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  tasks?: HuduProcedureTask[];
}

export interface HuduProcedureTask {
  id: number;
  name: string;
  description?: string;
  procedure_id: number;
  position: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface HuduNetwork {
  id: number;
  name: string;
  network_type: string;
  network: string;
  mask: string;
  gateway?: string;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduPasswordFolder {
  id: number;
  name: string;
  description?: string;
  company_id?: number;
  parent_folder_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduUpload {
  id: number;
  name: string;
  filename: string;
  size: number;
  content_type: string;
  uploadable_type?: string;
  uploadable_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduWebsite {
  id: number;
  name: string;
  url: string;
  company_id?: number;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface HuduVlan {
  id: number;
  name: string;
  vid: number;
  network_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduVlanZone {
  id: number;
  name: string;
  description?: string;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduIpAddress {
  id: number;
  address: string;
  hostname?: string;
  network_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduRelation {
  id: number;
  name: string;
  description?: string;
  fromable_type: string;
  fromable_id: number;
  toable_type: string;
  toable_id: number;
  created_at: string;
  updated_at: string;
}

export interface HuduList {
  id: number;
  name: string;
  description?: string;
  list_type: string;
  items: Array<{
    id: number;
    name: string;
    value?: any;
  }>;
  created_at: string;
  updated_at: string;
}

export interface HuduGroup {
  id: number;
  name: string;
  description?: string;
  permissions: Array<string>;
  created_at: string;
  updated_at: string;
}

export interface HuduMagicDash {
  id: number;
  name: string;
  description?: string;
  dashboard_url?: string;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduMatcher {
  id: number;
  name: string;
  matcher_type: string;
  identifier: string;
  potential_matches?: Array<any>;
  created_at: string;
  updated_at: string;
}

export interface HuduExpiration {
  id: number;
  name: string;
  expiration_date: string;
  item_type: string;
  item_id: number;
  company_id?: number;
  created_at: string;
}

export interface HuduExport {
  id: number;
  export_type: string;
  status: string;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

export interface HuduRackStorage {
  id: number;
  name: string;
  description?: string;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

export interface HuduRackStorageItem {
  id: number;
  name: string;
  rack_storage_id: number;
  position: number;
  size: number;
  item_type: string;
  created_at: string;
  updated_at: string;
}

export interface HuduPublicPhoto {
  id: number;
  name: string;
  filename: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface HuduCard {
  id: number;
  name: string;
  card_type: string;
  content: any;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

// MCP Resource Types
export const MCP_RESOURCE_TYPES = {
  ARTICLE: 'hudu://article',
  ASSET: 'hudu://asset', 
  PASSWORD: 'hudu://password',
  COMPANY: 'hudu://company',
  ASSET_LAYOUT: 'hudu://asset-layout',
  ACTIVITY_LOG: 'hudu://activity-log',
  FOLDER: 'hudu://folder',
  USER: 'hudu://user',
  PROCEDURE: 'hudu://procedure',
  PROCEDURE_TASK: 'hudu://procedure-task',
  NETWORK: 'hudu://network',
  PASSWORD_FOLDER: 'hudu://password-folder',
  UPLOAD: 'hudu://upload',
  WEBSITE: 'hudu://website',
  VLAN: 'hudu://vlan',
  VLAN_ZONE: 'hudu://vlan-zone',
  IP_ADDRESS: 'hudu://ip-address',
  RELATION: 'hudu://relation',
  LIST: 'hudu://list',
  GROUP: 'hudu://group',
  MAGIC_DASH: 'hudu://magic-dash',
  MATCHER: 'hudu://matcher',
  EXPIRATION: 'hudu://expiration',
  EXPORT: 'hudu://export',
  RACK_STORAGE: 'hudu://rack-storage',
  RACK_STORAGE_ITEM: 'hudu://rack-storage-item',
  PUBLIC_PHOTO: 'hudu://public-photo',
  CARD: 'hudu://card',
} as const;

// MCP Tool Names
export const MCP_TOOLS = {
  // Articles
  GET_ARTICLES: 'hudu_get_articles',
  GET_ARTICLE: 'hudu_get_article', 
  CREATE_ARTICLE: 'hudu_create_article',
  UPDATE_ARTICLE: 'hudu_update_article',
  DELETE_ARTICLE: 'hudu_delete_article',
  ARCHIVE_ARTICLE: 'hudu_archive_article',
  UNARCHIVE_ARTICLE: 'hudu_unarchive_article',
  
  // Assets
  GET_ASSETS: 'hudu_get_assets',
  GET_ASSET: 'hudu_get_asset',
  CREATE_ASSET: 'hudu_create_asset',
  UPDATE_ASSET: 'hudu_update_asset',
  DELETE_ASSET: 'hudu_delete_asset',
  ARCHIVE_ASSET: 'hudu_archive_asset',
  UNARCHIVE_ASSET: 'hudu_unarchive_asset',
  
  // Passwords
  GET_PASSWORDS: 'hudu_get_passwords',
  GET_PASSWORD: 'hudu_get_password',
  CREATE_PASSWORD: 'hudu_create_password',
  UPDATE_PASSWORD: 'hudu_update_password',
  DELETE_PASSWORD: 'hudu_delete_password',
  ARCHIVE_PASSWORD: 'hudu_archive_password',
  UNARCHIVE_PASSWORD: 'hudu_unarchive_password',
  
  // Companies
  GET_COMPANIES: 'hudu_get_companies',
  GET_COMPANY: 'hudu_get_company',
  CREATE_COMPANY: 'hudu_create_company',
  UPDATE_COMPANY: 'hudu_update_company',
  ARCHIVE_COMPANY: 'hudu_archive_company',
  UNARCHIVE_COMPANY: 'hudu_unarchive_company',
  
  // Asset Layouts
  GET_ASSET_LAYOUTS: 'hudu_get_asset_layouts',
  GET_ASSET_LAYOUT: 'hudu_get_asset_layout',
  CREATE_ASSET_LAYOUT: 'hudu_create_asset_layout',
  UPDATE_ASSET_LAYOUT: 'hudu_update_asset_layout',
  
  // Activity Logs
  GET_ACTIVITY_LOGS: 'hudu_get_activity_logs',
  DELETE_ACTIVITY_LOGS: 'hudu_delete_activity_logs',
  
  // Folders
  GET_FOLDERS: 'hudu_get_folders',
  GET_FOLDER: 'hudu_get_folder',
  CREATE_FOLDER: 'hudu_create_folder',
  UPDATE_FOLDER: 'hudu_update_folder',
  DELETE_FOLDER: 'hudu_delete_folder',
  
  // Users
  GET_USERS: 'hudu_get_users',
  GET_USER: 'hudu_get_user',
  CREATE_USER: 'hudu_create_user',
  UPDATE_USER: 'hudu_update_user',
  DELETE_USER: 'hudu_delete_user',
  
  // Procedures
  GET_PROCEDURES: 'hudu_get_procedures',
  GET_PROCEDURE: 'hudu_get_procedure',
  CREATE_PROCEDURE: 'hudu_create_procedure',
  UPDATE_PROCEDURE: 'hudu_update_procedure',
  DELETE_PROCEDURE: 'hudu_delete_procedure',
  KICKOFF_PROCEDURE: 'hudu_kickoff_procedure',
  DUPLICATE_PROCEDURE: 'hudu_duplicate_procedure',
  CREATE_FROM_TEMPLATE: 'hudu_create_from_template',
  
  // Procedure Tasks
  GET_PROCEDURE_TASKS: 'hudu_get_procedure_tasks',
  GET_PROCEDURE_TASK: 'hudu_get_procedure_task',
  CREATE_PROCEDURE_TASK: 'hudu_create_procedure_task',
  UPDATE_PROCEDURE_TASK: 'hudu_update_procedure_task',
  DELETE_PROCEDURE_TASK: 'hudu_delete_procedure_task',
  
  // Networks
  GET_NETWORKS: 'hudu_get_networks',
  GET_NETWORK: 'hudu_get_network',
  CREATE_NETWORK: 'hudu_create_network',
  UPDATE_NETWORK: 'hudu_update_network',
  DELETE_NETWORK: 'hudu_delete_network',
  
  // Password Folders
  GET_PASSWORD_FOLDERS: 'hudu_get_password_folders',
  GET_PASSWORD_FOLDER: 'hudu_get_password_folder',
  CREATE_PASSWORD_FOLDER: 'hudu_create_password_folder',
  UPDATE_PASSWORD_FOLDER: 'hudu_update_password_folder',
  DELETE_PASSWORD_FOLDER: 'hudu_delete_password_folder',
  
  // Uploads
  GET_UPLOADS: 'hudu_get_uploads',
  GET_UPLOAD: 'hudu_get_upload',
  CREATE_UPLOAD: 'hudu_create_upload',
  UPDATE_UPLOAD: 'hudu_update_upload',
  DELETE_UPLOAD: 'hudu_delete_upload',
  
  // Websites
  GET_WEBSITES: 'hudu_get_websites',
  GET_WEBSITE: 'hudu_get_website',
  CREATE_WEBSITE: 'hudu_create_website',
  UPDATE_WEBSITE: 'hudu_update_website',
  DELETE_WEBSITE: 'hudu_delete_website',
  
  // VLANs
  GET_VLANS: 'hudu_get_vlans',
  GET_VLAN: 'hudu_get_vlan',
  CREATE_VLAN: 'hudu_create_vlan',
  UPDATE_VLAN: 'hudu_update_vlan',
  DELETE_VLAN: 'hudu_delete_vlan',
  
  // VLAN Zones
  GET_VLAN_ZONES: 'hudu_get_vlan_zones',
  GET_VLAN_ZONE: 'hudu_get_vlan_zone',
  CREATE_VLAN_ZONE: 'hudu_create_vlan_zone',
  UPDATE_VLAN_ZONE: 'hudu_update_vlan_zone',
  DELETE_VLAN_ZONE: 'hudu_delete_vlan_zone',
  
  // IP Addresses
  GET_IP_ADDRESSES: 'hudu_get_ip_addresses',
  GET_IP_ADDRESS: 'hudu_get_ip_address',
  CREATE_IP_ADDRESS: 'hudu_create_ip_address',
  UPDATE_IP_ADDRESS: 'hudu_update_ip_address',
  DELETE_IP_ADDRESS: 'hudu_delete_ip_address',
  
  // Relations
  GET_RELATIONS: 'hudu_get_relations',
  GET_RELATION: 'hudu_get_relation',
  CREATE_RELATION: 'hudu_create_relation',
  UPDATE_RELATION: 'hudu_update_relation',
  DELETE_RELATION: 'hudu_delete_relation',
  
  // Lists
  GET_LISTS: 'hudu_get_lists',
  GET_LIST: 'hudu_get_list',
  CREATE_LIST: 'hudu_create_list',
  UPDATE_LIST: 'hudu_update_list',
  DELETE_LIST: 'hudu_delete_list',
  
  // Groups
  GET_GROUPS: 'hudu_get_groups',
  GET_GROUP: 'hudu_get_group',
  CREATE_GROUP: 'hudu_create_group',
  UPDATE_GROUP: 'hudu_update_group',
  DELETE_GROUP: 'hudu_delete_group',
  
  // Magic Dash
  GET_MAGIC_DASHES: 'hudu_get_magic_dashes',
  GET_MAGIC_DASH: 'hudu_get_magic_dash',
  CREATE_MAGIC_DASH: 'hudu_create_magic_dash',
  UPDATE_MAGIC_DASH: 'hudu_update_magic_dash',
  DELETE_MAGIC_DASH: 'hudu_delete_magic_dash',
  
  // Matchers
  GET_MATCHERS: 'hudu_get_matchers',
  GET_MATCHER: 'hudu_get_matcher',
  CREATE_MATCHER: 'hudu_create_matcher',
  UPDATE_MATCHER: 'hudu_update_matcher',
  DELETE_MATCHER: 'hudu_delete_matcher',
  
  // Expirations
  GET_EXPIRATIONS: 'hudu_get_expirations',
  
  // Exports
  GET_EXPORTS: 'hudu_get_exports',
  GET_S3_EXPORTS: 'hudu_get_s3_exports',
  
  // Rack Storage
  GET_RACK_STORAGES: 'hudu_get_rack_storages',
  GET_RACK_STORAGE: 'hudu_get_rack_storage',
  CREATE_RACK_STORAGE: 'hudu_create_rack_storage',
  UPDATE_RACK_STORAGE: 'hudu_update_rack_storage',
  DELETE_RACK_STORAGE: 'hudu_delete_rack_storage',
  
  // Rack Storage Items
  GET_RACK_STORAGE_ITEMS: 'hudu_get_rack_storage_items',
  GET_RACK_STORAGE_ITEM: 'hudu_get_rack_storage_item',
  CREATE_RACK_STORAGE_ITEM: 'hudu_create_rack_storage_item',
  UPDATE_RACK_STORAGE_ITEM: 'hudu_update_rack_storage_item',
  DELETE_RACK_STORAGE_ITEM: 'hudu_delete_rack_storage_item',
  
  // Public Photos
  GET_PUBLIC_PHOTOS: 'hudu_get_public_photos',
  GET_PUBLIC_PHOTO: 'hudu_get_public_photo',
  CREATE_PUBLIC_PHOTO: 'hudu_create_public_photo',
  UPDATE_PUBLIC_PHOTO: 'hudu_update_public_photo',
  DELETE_PUBLIC_PHOTO: 'hudu_delete_public_photo',
  
  // Cards
  CARD_JUMP: 'hudu_card_jump',
  CARD_LOOKUP: 'hudu_card_lookup',
  
  // Company Assets (special endpoints)
  GET_COMPANY_ASSETS: 'hudu_get_company_assets',
  GET_COMPANY_ASSET: 'hudu_get_company_asset',
  ARCHIVE_COMPANY_ASSET: 'hudu_archive_company_asset',
  UNARCHIVE_COMPANY_ASSET: 'hudu_unarchive_company_asset',
  MOVE_COMPANY_ASSET_LAYOUT: 'hudu_move_company_asset_layout',
  
  // Company Jump
  COMPANY_JUMP: 'hudu_company_jump',
  
  // Search
  SEARCH_ALL: 'hudu_search_all',
  
  // API Info
  GET_API_INFO: 'hudu_get_api_info',
} as const;