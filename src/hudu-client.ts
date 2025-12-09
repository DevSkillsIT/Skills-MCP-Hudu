import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  HuduConfig,
  HuduApiResponse,
  HuduArticle,
  HuduAsset,
  HuduAssetPassword,
  HuduCompany,
  HuduAssetLayout,
  HuduActivityLog,
  HuduFolder,
  HuduUser,
  HuduProcedure,
  HuduProcedureTask,
  HuduNetwork,
  HuduPasswordFolder,
  HuduUpload,
  HuduWebsite,
  HuduVlan,
  HuduVlanZone,
  HuduIpAddress,
  HuduRelation,
  HuduList,
  HuduGroup,
  HuduMagicDash,
  HuduMatcher,
  HuduExpiration,
  HuduExport,
  HuduRackStorage,
  HuduRackStorageItem,
  HuduPublicPhoto,
  HuduCard
} from './types.js';

/**
 * Função auxiliar para extrair dados da resposta da API do Hudu.
 * A API do Hudu retorna formatos inconsistentes:
 * - Alguns endpoints retornam: { "resources": [...] }
 * - Outros endpoints retornam: [...]
 * Esta função lida com ambos os formatos.
 *
 * @param data - Dados da resposta da API
 * @param key - Chave esperada no objeto (ex: "networks", "vlans")
 * @returns Array de recursos
 */
function extractArrayResponse<T>(data: T[] | { [key: string]: T[] }, key: string): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return (data as { [key: string]: T[] })[key] || [];
}

export class HuduClient {
  private client: AxiosInstance;

  constructor(private config: HuduConfig) {
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout,
    });
  }

  // Articles
  async getArticles(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    slug?: string;
    draft?: boolean;
    updated_at?: string;
  }): Promise<HuduArticle[]> {
    const response = await this.client.get<{ articles: HuduArticle[] }>('/articles', { params });
    return response.data.articles;
  }

  async getArticle(id: number): Promise<HuduArticle> {
    const response = await this.client.get<{ article: HuduArticle }>(`/articles/${id}`);
    return response.data.article;
  }

  async createArticle(article: Partial<HuduArticle>): Promise<HuduArticle> {
    const response = await this.client.post<{ article: HuduArticle }>('/articles', { article });
    return response.data.article;
  }

  async updateArticle(id: number, article: Partial<HuduArticle>): Promise<HuduArticle> {
    const response = await this.client.put<{ article: HuduArticle }>(`/articles/${id}`, { article });
    return response.data.article;
  }

  async deleteArticle(id: number): Promise<void> {
    await this.client.delete(`/articles/${id}`);
  }

  async archiveArticle(id: number): Promise<HuduArticle> {
    const response = await this.client.put<{ article: HuduArticle }>(`/articles/${id}/archive`);
    return response.data.article;
  }

  async unarchiveArticle(id: number): Promise<HuduArticle> {
    const response = await this.client.put<{ article: HuduArticle }>(`/articles/${id}/unarchive`);
    return response.data.article;
  }

  // Assets
  async getAssets(params?: {
    name?: string;
    company_id?: number;
    asset_layout_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    archived?: boolean;
    updated_at?: string;
  }): Promise<HuduAsset[]> {
    const response = await this.client.get<{ assets: HuduAsset[] }>('/assets', { params });
    return response.data.assets;
  }

  async getAsset(id: number): Promise<HuduAsset> {
    const response = await this.client.get<{ asset: HuduAsset }>(`/assets/${id}`);
    return response.data.asset;
  }

  async createAsset(asset: Partial<HuduAsset>): Promise<HuduAsset> {
    const response = await this.client.post<{ asset: HuduAsset }>('/assets', { asset });
    return response.data.asset;
  }

  async updateAsset(id: number, asset: Partial<HuduAsset>): Promise<HuduAsset> {
    const response = await this.client.put<{ asset: HuduAsset }>(`/assets/${id}`, { asset });
    return response.data.asset;
  }

  async deleteAsset(id: number): Promise<void> {
    await this.client.delete(`/assets/${id}`);
  }

  async archiveAsset(id: number): Promise<HuduAsset> {
    const response = await this.client.put<{ asset: HuduAsset }>(`/assets/${id}/archive`);
    return response.data.asset;
  }

  async unarchiveAsset(id: number): Promise<HuduAsset> {
    const response = await this.client.put<{ asset: HuduAsset }>(`/assets/${id}/unarchive`);
    return response.data.asset;
  }

  // Asset Passwords
  async getAssetPasswords(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    archived?: boolean;
    updated_at?: string;
  }): Promise<HuduAssetPassword[]> {
    const response = await this.client.get<{ asset_passwords: HuduAssetPassword[] }>('/asset_passwords', { params });
    return response.data.asset_passwords;
  }

  async getAssetPassword(id: number): Promise<HuduAssetPassword> {
    const response = await this.client.get<{ asset_password: HuduAssetPassword }>(`/asset_passwords/${id}`);
    return response.data.asset_password;
  }

  async createAssetPassword(password: Partial<HuduAssetPassword>): Promise<HuduAssetPassword> {
    const response = await this.client.post<{ asset_password: HuduAssetPassword }>('/asset_passwords', { asset_password: password });
    return response.data.asset_password;
  }

  async updateAssetPassword(id: number, password: Partial<HuduAssetPassword>): Promise<HuduAssetPassword> {
    const response = await this.client.put<{ asset_password: HuduAssetPassword }>(`/asset_passwords/${id}`, { asset_password: password });
    return response.data.asset_password;
  }

  async deleteAssetPassword(id: number): Promise<void> {
    await this.client.delete(`/asset_passwords/${id}`);
  }

  async archiveAssetPassword(id: number): Promise<HuduAssetPassword> {
    const response = await this.client.put<{ asset_password: HuduAssetPassword }>(`/asset_passwords/${id}/archive`);
    return response.data.asset_password;
  }

  async unarchiveAssetPassword(id: number): Promise<HuduAssetPassword> {
    const response = await this.client.put<{ asset_password: HuduAssetPassword }>(`/asset_passwords/${id}/unarchive`);
    return response.data.asset_password;
  }

  // Companies
  async getCompanies(params?: {
    name?: string;
    page?: number;
    page_size?: number;
    search?: string;
    id_in_integration?: string;
    updated_at?: string;
  }): Promise<HuduCompany[]> {
    const response = await this.client.get<{ companies: HuduCompany[] }>('/companies', { params });
    return response.data.companies;
  }

  async getCompany(id: number): Promise<HuduCompany> {
    const response = await this.client.get<{ company: HuduCompany }>(`/companies/${id}`);
    return response.data.company;
  }

  async createCompany(company: Partial<HuduCompany>): Promise<HuduCompany> {
    const response = await this.client.post<{ company: HuduCompany }>('/companies', { company });
    return response.data.company;
  }

  async updateCompany(id: number, company: Partial<HuduCompany>): Promise<HuduCompany> {
    const response = await this.client.put<{ company: HuduCompany }>(`/companies/${id}`, { company });
    return response.data.company;
  }

  async archiveCompany(id: number): Promise<HuduCompany> {
    const response = await this.client.put<{ company: HuduCompany }>(`/companies/${id}/archive`);
    return response.data.company;
  }

  async unarchiveCompany(id: number): Promise<HuduCompany> {
    const response = await this.client.put<{ company: HuduCompany }>(`/companies/${id}/unarchive`);
    return response.data.company;
  }

  // Asset Layouts
  async getAssetLayouts(params?: {
    name?: string;
    page?: number;
    slug?: string;
    updated_at?: string;
  }): Promise<HuduAssetLayout[]> {
    const response = await this.client.get<{ asset_layouts: HuduAssetLayout[] }>('/asset_layouts', { params });
    return response.data.asset_layouts;
  }

  async getAssetLayout(id: number): Promise<HuduAssetLayout> {
    const response = await this.client.get<{ asset_layout: HuduAssetLayout }>(`/asset_layouts/${id}`);
    return response.data.asset_layout;
  }

  async createAssetLayout(layout: Partial<HuduAssetLayout>): Promise<HuduAssetLayout> {
    const response = await this.client.post<{ asset_layout: HuduAssetLayout }>('/asset_layouts', { asset_layout: layout });
    return response.data.asset_layout;
  }

  async updateAssetLayout(id: number, layout: Partial<HuduAssetLayout>): Promise<HuduAssetLayout> {
    const response = await this.client.put<{ asset_layout: HuduAssetLayout }>(`/asset_layouts/${id}`, { asset_layout: layout });
    return response.data.asset_layout;
  }

  // Activity Logs
  async getActivityLogs(params?: {
    page?: number;
    user_id?: number;
    user_email?: string;
    resource_id?: number;
    resource_type?: string;
    action_message?: string;
    start_date?: string;
    page_size?: number;
  }): Promise<HuduActivityLog[]> {
    const response = await this.client.get<{ activity_logs: HuduActivityLog[] }>('/activity_logs', { params });
    return response.data.activity_logs;
  }

  async deleteActivityLogs(datetime: string, deleteUnassignedLogs?: boolean): Promise<void> {
    await this.client.delete('/activity_logs', {
      params: {
        datetime,
        delete_unassigned_logs: deleteUnassignedLogs
      }
    });
  }

  // API Info
  async getApiInfo(): Promise<{ version: string; date: string }> {
    const response = await this.client.get<{ version: string; date: string }>('/api_info');
    return response.data;
  }

  // Folders
  async getFolders(params?: {
    name?: string;
    page?: number;
    company_id?: number;
  }): Promise<HuduFolder[]> {
    const response = await this.client.get<{ folders: HuduFolder[] }>('/folders', { params });
    return response.data.folders;
  }

  async getFolder(id: number): Promise<HuduFolder> {
    const response = await this.client.get<{ folder: HuduFolder }>(`/folders/${id}`);
    return response.data.folder;
  }

  async createFolder(folder: Partial<HuduFolder>): Promise<HuduFolder> {
    const response = await this.client.post<{ folder: HuduFolder }>('/folders', { folder });
    return response.data.folder;
  }

  async updateFolder(id: number, folder: Partial<HuduFolder>): Promise<HuduFolder> {
    const response = await this.client.put<{ folder: HuduFolder }>(`/folders/${id}`, { folder });
    return response.data.folder;
  }

  async deleteFolder(id: number): Promise<void> {
    await this.client.delete(`/folders/${id}`);
  }

  // Users
  async getUsers(params?: {
    page?: number;
    email?: string;
    name?: string;
  }): Promise<HuduUser[]> {
    const response = await this.client.get<{ users: HuduUser[] }>('/users', { params });
    return response.data.users;
  }

  async getUser(id: number): Promise<HuduUser> {
    const response = await this.client.get<{ user: HuduUser }>(`/users/${id}`);
    return response.data.user;
  }

  async createUser(user: Partial<HuduUser>): Promise<HuduUser> {
    const response = await this.client.post<{ user: HuduUser }>('/users', { user });
    return response.data.user;
  }

  async updateUser(id: number, user: Partial<HuduUser>): Promise<HuduUser> {
    const response = await this.client.put<{ user: HuduUser }>(`/users/${id}`, { user });
    return response.data.user;
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Procedures
  async getProcedures(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduProcedure[]> {
    const response = await this.client.get<{ procedures: HuduProcedure[] }>('/procedures', { params });
    return response.data.procedures;
  }

  async getProcedure(id: number): Promise<HuduProcedure> {
    const response = await this.client.get<{ procedure: HuduProcedure }>(`/procedures/${id}`);
    return response.data.procedure;
  }

  async createProcedure(procedure: Partial<HuduProcedure>): Promise<HuduProcedure> {
    const response = await this.client.post<{ procedure: HuduProcedure }>('/procedures', { procedure });
    return response.data.procedure;
  }

  async updateProcedure(id: number, procedure: Partial<HuduProcedure>): Promise<HuduProcedure> {
    const response = await this.client.put<{ procedure: HuduProcedure }>(`/procedures/${id}`, { procedure });
    return response.data.procedure;
  }

  async deleteProcedure(id: number): Promise<void> {
    await this.client.delete(`/procedures/${id}`);
  }

  async kickoffProcedure(id: number): Promise<HuduProcedure> {
    const response = await this.client.put<{ procedure: HuduProcedure }>(`/procedures/${id}/kickoff`);
    return response.data.procedure;
  }

  async duplicateProcedure(id: number): Promise<HuduProcedure> {
    const response = await this.client.put<{ procedure: HuduProcedure }>(`/procedures/${id}/duplicate`);
    return response.data.procedure;
  }

  async createFromTemplate(id: number): Promise<HuduProcedure> {
    const response = await this.client.put<{ procedure: HuduProcedure }>(`/procedures/${id}/create_from_template`);
    return response.data.procedure;
  }

  // Procedure Tasks
  async getProcedureTasks(params?: {
    procedure_id?: number;
    page?: number;
  }): Promise<HuduProcedureTask[]> {
    const response = await this.client.get<{ procedure_tasks: HuduProcedureTask[] }>('/procedure_tasks', { params });
    return response.data.procedure_tasks;
  }

  async getProcedureTask(id: number): Promise<HuduProcedureTask> {
    const response = await this.client.get<{ procedure_task: HuduProcedureTask }>(`/procedure_tasks/${id}`);
    return response.data.procedure_task;
  }

  async createProcedureTask(task: Partial<HuduProcedureTask>): Promise<HuduProcedureTask> {
    const response = await this.client.post<{ procedure_task: HuduProcedureTask }>('/procedure_tasks', { procedure_task: task });
    return response.data.procedure_task;
  }

  async updateProcedureTask(id: number, task: Partial<HuduProcedureTask>): Promise<HuduProcedureTask> {
    const response = await this.client.put<{ procedure_task: HuduProcedureTask }>(`/procedure_tasks/${id}`, { procedure_task: task });
    return response.data.procedure_task;
  }

  async deleteProcedureTask(id: number): Promise<void> {
    await this.client.delete(`/procedure_tasks/${id}`);
  }

  // Networks - CORRIGIDO: API retorna array direto, não objeto
  async getNetworks(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduNetwork[]> {
    const response = await this.client.get<HuduNetwork[] | { networks: HuduNetwork[] }>('/networks', { params });
    return extractArrayResponse(response.data, 'networks');
  }

  async getNetwork(id: number): Promise<HuduNetwork> {
    const response = await this.client.get<any>(`/networks/${id}`);
    // Handle both formats: { network: {...} } or {...}
    return response.data.network || response.data;
  }

  async createNetwork(network: Partial<HuduNetwork>): Promise<HuduNetwork> {
    const response = await this.client.post<{ network: HuduNetwork }>('/networks', { network });
    return response.data.network;
  }

  async updateNetwork(id: number, network: Partial<HuduNetwork>): Promise<HuduNetwork> {
    const response = await this.client.put<{ network: HuduNetwork }>(`/networks/${id}`, { network });
    return response.data.network;
  }

  async deleteNetwork(id: number): Promise<void> {
    await this.client.delete(`/networks/${id}`);
  }

  // Password Folders
  async getPasswordFolders(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduPasswordFolder[]> {
    const response = await this.client.get<{ password_folders: HuduPasswordFolder[] }>('/password_folders', { params });
    return response.data.password_folders;
  }

  async getPasswordFolder(id: number): Promise<HuduPasswordFolder> {
    const response = await this.client.get<{ password_folder: HuduPasswordFolder }>(`/password_folders/${id}`);
    return response.data.password_folder;
  }

  async createPasswordFolder(folder: Partial<HuduPasswordFolder>): Promise<HuduPasswordFolder> {
    const response = await this.client.post<{ password_folder: HuduPasswordFolder }>('/password_folders', { password_folder: folder });
    return response.data.password_folder;
  }

  async updatePasswordFolder(id: number, folder: Partial<HuduPasswordFolder>): Promise<HuduPasswordFolder> {
    const response = await this.client.put<{ password_folder: HuduPasswordFolder }>(`/password_folders/${id}`, { password_folder: folder });
    return response.data.password_folder;
  }

  async deletePasswordFolder(id: number): Promise<void> {
    await this.client.delete(`/password_folders/${id}`);
  }

  // Uploads
  async getUploads(params?: {
    name?: string;
    page?: number;
  }): Promise<HuduUpload[]> {
    const response = await this.client.get<{ uploads: HuduUpload[] }>('/uploads', { params });
    return response.data.uploads;
  }

  async getUpload(id: number): Promise<HuduUpload> {
    const response = await this.client.get<{ upload: HuduUpload }>(`/uploads/${id}`);
    return response.data.upload;
  }

  async createUpload(upload: Partial<HuduUpload>): Promise<HuduUpload> {
    const response = await this.client.post<{ upload: HuduUpload }>('/uploads', { upload });
    return response.data.upload;
  }

  async updateUpload(id: number, upload: Partial<HuduUpload>): Promise<HuduUpload> {
    const response = await this.client.put<{ upload: HuduUpload }>(`/uploads/${id}`, { upload });
    return response.data.upload;
  }

  async deleteUpload(id: number): Promise<void> {
    await this.client.delete(`/uploads/${id}`);
  }

  // Websites
  async getWebsites(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduWebsite[]> {
    const response = await this.client.get<{ websites: HuduWebsite[] }>('/websites', { params });
    return response.data.websites;
  }

  async getWebsite(id: number): Promise<HuduWebsite> {
    const response = await this.client.get<{ website: HuduWebsite }>(`/websites/${id}`);
    return response.data.website;
  }

  async createWebsite(website: Partial<HuduWebsite>): Promise<HuduWebsite> {
    const response = await this.client.post<{ website: HuduWebsite }>('/websites', { website });
    return response.data.website;
  }

  async updateWebsite(id: number, website: Partial<HuduWebsite>): Promise<HuduWebsite> {
    const response = await this.client.put<{ website: HuduWebsite }>(`/websites/${id}`, { website });
    return response.data.website;
  }

  async deleteWebsite(id: number): Promise<void> {
    await this.client.delete(`/websites/${id}`);
  }

  // VLANs - CORRIGIDO: API retorna array direto, não objeto
  async getVlans(params?: {
    name?: string;
    network_id?: number;
    page?: number;
  }): Promise<HuduVlan[]> {
    const response = await this.client.get<HuduVlan[] | { vlans: HuduVlan[] }>('/vlans', { params });
    return extractArrayResponse(response.data, 'vlans');
  }

  async getVlan(id: number): Promise<HuduVlan> {
    const response = await this.client.get<any>(`/vlans/${id}`);
    return response.data.vlan || response.data;
  }

  async createVlan(vlan: Partial<HuduVlan>): Promise<HuduVlan> {
    const response = await this.client.post<{ vlan: HuduVlan }>('/vlans', { vlan });
    return response.data.vlan;
  }

  async updateVlan(id: number, vlan: Partial<HuduVlan>): Promise<HuduVlan> {
    const response = await this.client.put<{ vlan: HuduVlan }>(`/vlans/${id}`, { vlan });
    return response.data.vlan;
  }

  async deleteVlan(id: number): Promise<void> {
    await this.client.delete(`/vlans/${id}`);
  }

  // VLAN Zones - CORRIGIDO: API retorna array direto, não objeto
  async getVlanZones(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduVlanZone[]> {
    const response = await this.client.get<HuduVlanZone[] | { vlan_zones: HuduVlanZone[] }>('/vlan_zones', { params });
    return extractArrayResponse(response.data, 'vlan_zones');
  }

  async getVlanZone(id: number): Promise<HuduVlanZone> {
    const response = await this.client.get<any>(`/vlan_zones/${id}`);
    return response.data.vlan_zone || response.data;
  }

  async createVlanZone(zone: Partial<HuduVlanZone>): Promise<HuduVlanZone> {
    const response = await this.client.post<{ vlan_zone: HuduVlanZone }>('/vlan_zones', { vlan_zone: zone });
    return response.data.vlan_zone;
  }

  async updateVlanZone(id: number, zone: Partial<HuduVlanZone>): Promise<HuduVlanZone> {
    const response = await this.client.put<{ vlan_zone: HuduVlanZone }>(`/vlan_zones/${id}`, { vlan_zone: zone });
    return response.data.vlan_zone;
  }

  async deleteVlanZone(id: number): Promise<void> {
    await this.client.delete(`/vlan_zones/${id}`);
  }

  // IP Addresses - CORRIGIDO: API retorna array direto, não objeto
  async getIpAddresses(params?: {
    address?: string;
    network_id?: number;
    page?: number;
  }): Promise<HuduIpAddress[]> {
    const response = await this.client.get<HuduIpAddress[] | { ip_addresses: HuduIpAddress[] }>('/ip_addresses', { params });
    return extractArrayResponse(response.data, 'ip_addresses');
  }

  async getIpAddress(id: number): Promise<HuduIpAddress> {
    const response = await this.client.get<any>(`/ip_addresses/${id}`);
    return response.data.ip_address || response.data;
  }

  async createIpAddress(ipAddress: Partial<HuduIpAddress>): Promise<HuduIpAddress> {
    const response = await this.client.post<{ ip_address: HuduIpAddress }>('/ip_addresses', { ip_address: ipAddress });
    return response.data.ip_address;
  }

  async updateIpAddress(id: number, ipAddress: Partial<HuduIpAddress>): Promise<HuduIpAddress> {
    const response = await this.client.put<{ ip_address: HuduIpAddress }>(`/ip_addresses/${id}`, { ip_address: ipAddress });
    return response.data.ip_address;
  }

  async deleteIpAddress(id: number): Promise<void> {
    await this.client.delete(`/ip_addresses/${id}`);
  }

  // Relations
  async getRelations(params?: {
    fromable_type?: string;
    fromable_id?: number;
    toable_type?: string;
    toable_id?: number;
    page?: number;
  }): Promise<HuduRelation[]> {
    const response = await this.client.get<{ relations: HuduRelation[] }>('/relations', { params });
    return response.data.relations;
  }

  async getRelation(id: number): Promise<HuduRelation> {
    const response = await this.client.get<{ relation: HuduRelation }>(`/relations/${id}`);
    return response.data.relation;
  }

  async createRelation(relation: Partial<HuduRelation>): Promise<HuduRelation> {
    const response = await this.client.post<{ relation: HuduRelation }>('/relations', { relation });
    return response.data.relation;
  }

  async updateRelation(id: number, relation: Partial<HuduRelation>): Promise<HuduRelation> {
    const response = await this.client.put<{ relation: HuduRelation }>(`/relations/${id}`, { relation });
    return response.data.relation;
  }

  async deleteRelation(id: number): Promise<void> {
    await this.client.delete(`/relations/${id}`);
  }

  // Lists
  async getLists(params?: {
    name?: string;
    list_type?: string;
    page?: number;
  }): Promise<HuduList[]> {
    const response = await this.client.get<{ lists: HuduList[] }>('/lists', { params });
    return response.data.lists;
  }

  async getList(id: number): Promise<HuduList> {
    const response = await this.client.get<{ list: HuduList }>(`/lists/${id}`);
    return response.data.list;
  }

  async createList(list: Partial<HuduList>): Promise<HuduList> {
    const response = await this.client.post<{ list: HuduList }>('/lists', { list });
    return response.data.list;
  }

  async updateList(id: number, list: Partial<HuduList>): Promise<HuduList> {
    const response = await this.client.put<{ list: HuduList }>(`/lists/${id}`, { list });
    return response.data.list;
  }

  async deleteList(id: number): Promise<void> {
    await this.client.delete(`/lists/${id}`);
  }

  // Groups
  async getGroups(params?: {
    name?: string;
    page?: number;
  }): Promise<HuduGroup[]> {
    const response = await this.client.get<{ groups: HuduGroup[] }>('/groups', { params });
    return response.data.groups;
  }

  async getGroup(id: number): Promise<HuduGroup> {
    const response = await this.client.get<{ group: HuduGroup }>(`/groups/${id}`);
    return response.data.group;
  }

  async createGroup(group: Partial<HuduGroup>): Promise<HuduGroup> {
    const response = await this.client.post<{ group: HuduGroup }>('/groups', { group });
    return response.data.group;
  }

  async updateGroup(id: number, group: Partial<HuduGroup>): Promise<HuduGroup> {
    const response = await this.client.put<{ group: HuduGroup }>(`/groups/${id}`, { group });
    return response.data.group;
  }

  async deleteGroup(id: number): Promise<void> {
    await this.client.delete(`/groups/${id}`);
  }

  // Magic Dash
  async getMagicDashes(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduMagicDash[]> {
    const response = await this.client.get<{ magic_dash: HuduMagicDash[] }>('/magic_dash', { params });
    return response.data.magic_dash;
  }

  async getMagicDash(id: number): Promise<HuduMagicDash> {
    const response = await this.client.get<{ magic_dash: HuduMagicDash }>(`/magic_dash/${id}`);
    return response.data.magic_dash;
  }

  async createMagicDash(magicDash: Partial<HuduMagicDash>): Promise<HuduMagicDash> {
    const response = await this.client.post<{ magic_dash: HuduMagicDash }>('/magic_dash', { magic_dash: magicDash });
    return response.data.magic_dash;
  }

  async updateMagicDash(id: number, magicDash: Partial<HuduMagicDash>): Promise<HuduMagicDash> {
    const response = await this.client.put<{ magic_dash: HuduMagicDash }>(`/magic_dash/${id}`, { magic_dash: magicDash });
    return response.data.magic_dash;
  }

  async deleteMagicDash(id: number): Promise<void> {
    await this.client.delete(`/magic_dash/${id}`);
  }

  // Matchers
  async getMatchers(params?: {
    name?: string;
    matcher_type?: string;
    page?: number;
  }): Promise<HuduMatcher[]> {
    const response = await this.client.get<{ matchers: HuduMatcher[] }>('/matchers', { params });
    return response.data.matchers;
  }

  async getMatcher(id: number): Promise<HuduMatcher> {
    const response = await this.client.get<{ matcher: HuduMatcher }>(`/matchers/${id}`);
    return response.data.matcher;
  }

  async createMatcher(matcher: Partial<HuduMatcher>): Promise<HuduMatcher> {
    const response = await this.client.post<{ matcher: HuduMatcher }>('/matchers', { matcher });
    return response.data.matcher;
  }

  async updateMatcher(id: number, matcher: Partial<HuduMatcher>): Promise<HuduMatcher> {
    const response = await this.client.put<{ matcher: HuduMatcher }>(`/matchers/${id}`, { matcher });
    return response.data.matcher;
  }

  async deleteMatcher(id: number): Promise<void> {
    await this.client.delete(`/matchers/${id}`);
  }

  // Expirations
  async getExpirations(params?: {
    company_id?: number;
    item_type?: string;
    page?: number;
  }): Promise<HuduExpiration[]> {
    const response = await this.client.get<{ expirations: HuduExpiration[] }>('/expirations', { params });
    return response.data.expirations;
  }

  // Exports
  async getExports(params?: {
    export_type?: string;
    page?: number;
  }): Promise<HuduExport[]> {
    const response = await this.client.get<{ exports: HuduExport[] }>('/exports', { params });
    return response.data.exports;
  }

  async getS3Exports(params?: {
    page?: number;
  }): Promise<HuduExport[]> {
    const response = await this.client.get<{ s3_exports: HuduExport[] }>('/s3_exports', { params });
    return response.data.s3_exports;
  }

  // Rack Storage - CORRIGIDO: API pode retornar array direto
  async getRackStorages(params?: {
    name?: string;
    company_id?: number;
    page?: number;
  }): Promise<HuduRackStorage[]> {
    const response = await this.client.get<HuduRackStorage[] | { rack_storages: HuduRackStorage[] }>('/rack_storages', { params });
    return extractArrayResponse(response.data, 'rack_storages');
  }

  async getRackStorage(id: number): Promise<HuduRackStorage> {
    const response = await this.client.get<{ rack_storage: HuduRackStorage }>(`/rack_storages/${id}`);
    return response.data.rack_storage;
  }

  async createRackStorage(rackStorage: Partial<HuduRackStorage>): Promise<HuduRackStorage> {
    const response = await this.client.post<{ rack_storage: HuduRackStorage }>('/rack_storages', { rack_storage: rackStorage });
    return response.data.rack_storage;
  }

  async updateRackStorage(id: number, rackStorage: Partial<HuduRackStorage>): Promise<HuduRackStorage> {
    const response = await this.client.put<{ rack_storage: HuduRackStorage }>(`/rack_storages/${id}`, { rack_storage: rackStorage });
    return response.data.rack_storage;
  }

  async deleteRackStorage(id: number): Promise<void> {
    await this.client.delete(`/rack_storages/${id}`);
  }

  // Rack Storage Items - CORRIGIDO: API pode retornar array direto
  async getRackStorageItems(params?: {
    rack_storage_id?: number;
    page?: number;
  }): Promise<HuduRackStorageItem[]> {
    const response = await this.client.get<HuduRackStorageItem[] | { rack_storage_items: HuduRackStorageItem[] }>('/rack_storage_items', { params });
    return extractArrayResponse(response.data, 'rack_storage_items');
  }

  async getRackStorageItem(id: number): Promise<HuduRackStorageItem> {
    const response = await this.client.get<{ rack_storage_item: HuduRackStorageItem }>(`/rack_storage_items/${id}`);
    return response.data.rack_storage_item;
  }

  async createRackStorageItem(item: Partial<HuduRackStorageItem>): Promise<HuduRackStorageItem> {
    const response = await this.client.post<{ rack_storage_item: HuduRackStorageItem }>('/rack_storage_items', { rack_storage_item: item });
    return response.data.rack_storage_item;
  }

  async updateRackStorageItem(id: number, item: Partial<HuduRackStorageItem>): Promise<HuduRackStorageItem> {
    const response = await this.client.put<{ rack_storage_item: HuduRackStorageItem }>(`/rack_storage_items/${id}`, { rack_storage_item: item });
    return response.data.rack_storage_item;
  }

  async deleteRackStorageItem(id: number): Promise<void> {
    await this.client.delete(`/rack_storage_items/${id}`);
  }

  // Public Photos - CORRIGIDO: API pode retornar array direto
  async getPublicPhotos(params?: {
    name?: string;
    page?: number;
  }): Promise<HuduPublicPhoto[]> {
    const response = await this.client.get<HuduPublicPhoto[] | { public_photos: HuduPublicPhoto[] }>('/public_photos', { params });
    return extractArrayResponse(response.data, 'public_photos');
  }

  async getPublicPhoto(id: number): Promise<HuduPublicPhoto> {
    const response = await this.client.get<{ public_photo: HuduPublicPhoto }>(`/public_photos/${id}`);
    return response.data.public_photo;
  }

  async createPublicPhoto(photo: Partial<HuduPublicPhoto>): Promise<HuduPublicPhoto> {
    const response = await this.client.post<{ public_photo: HuduPublicPhoto }>('/public_photos', { public_photo: photo });
    return response.data.public_photo;
  }

  async updatePublicPhoto(id: number, photo: Partial<HuduPublicPhoto>): Promise<HuduPublicPhoto> {
    const response = await this.client.put<{ public_photo: HuduPublicPhoto }>(`/public_photos/${id}`, { public_photo: photo });
    return response.data.public_photo;
  }

  async deletePublicPhoto(id: number): Promise<void> {
    await this.client.delete(`/public_photos/${id}`);
  }

  // Cards - CORRIGIDO: pode retornar array direto
  async cardJump(params: {
    name: string;
    company_id?: number;
  }): Promise<HuduCard[]> {
    const response = await this.client.get<HuduCard[] | { cards: HuduCard[] }>('/cards/jump', { params });
    return extractArrayResponse(response.data, 'cards');
  }

  async cardLookup(params: {
    name: string;
    company_id?: number;
  }): Promise<HuduCard[]> {
    const response = await this.client.get<HuduCard[] | { cards: HuduCard[] }>('/cards/lookup', { params });
    return extractArrayResponse(response.data, 'cards');
  }

  // Company-specific Asset operations
  async getCompanyAssets(companyId: number, params?: {
    name?: string;
    asset_layout_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    archived?: boolean;
  }): Promise<HuduAsset[]> {
    const response = await this.client.get<{ assets: HuduAsset[] }>(`/companies/${companyId}/assets`, { params });
    return response.data.assets;
  }

  async getCompanyAsset(companyId: number, assetId: number): Promise<HuduAsset> {
    const response = await this.client.get<{ asset: HuduAsset }>(`/companies/${companyId}/assets/${assetId}`);
    return response.data.asset;
  }

  async archiveCompanyAsset(companyId: number, assetId: number): Promise<HuduAsset> {
    const response = await this.client.put<{ asset: HuduAsset }>(`/companies/${companyId}/assets/${assetId}/archive`);
    return response.data.asset;
  }

  async unarchiveCompanyAsset(companyId: number, assetId: number): Promise<HuduAsset> {
    const response = await this.client.put<{ asset: HuduAsset }>(`/companies/${companyId}/assets/${assetId}/unarchive`);
    return response.data.asset;
  }

  async moveCompanyAssetLayout(companyId: number, assetId: number, layoutId: number): Promise<HuduAsset> {
    const response = await this.client.put<{ asset: HuduAsset }>(`/companies/${companyId}/assets/${assetId}/move_layout`, {
      asset_layout_id: layoutId
    });
    return response.data.asset;
  }

  // Company Jump - CORRIGIDO: pode retornar array direto
  async companyJump(params: {
    name: string;
  }): Promise<HuduCompany[]> {
    const response = await this.client.get<HuduCompany[] | { companies: HuduCompany[] }>('/companies/jump', { params });
    return extractArrayResponse(response.data, 'companies');
  }
}
