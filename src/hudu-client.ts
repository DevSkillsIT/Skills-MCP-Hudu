import axios, { AxiosInstance } from 'axios';
import {
  HuduConfig,
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

// ---------------------------------------------------------------------------
// Simple LRU cache for company name lookups (REQ-06 / BUG-07)
// ---------------------------------------------------------------------------
interface LruEntry {
  name: string | null;
  expiresAt: number;
}

class CompanyNameCache {
  private readonly cache: Map<number, LruEntry>;
  private readonly capacity: number;
  private readonly ttlMs: number;

  constructor(capacity = 200, ttlMinutes = 5) {
    this.cache = new Map();
    this.capacity = capacity;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(id: number): string | null | undefined {
    const entry = this.cache.get(id);
    if (!entry) return undefined; // cache miss
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id);
      return undefined; // expired
    }
    // Move to end (most-recently-used)
    this.cache.delete(id);
    this.cache.set(id, entry);
    console.error(`[cache] company hit id=${id} name=${entry.name ?? 'null'}`);
    return entry.name;
  }

  set(id: number, name: string | null): void {
    if (this.cache.has(id)) {
      this.cache.delete(id);
    } else if (this.cache.size >= this.capacity) {
      // Evict least-recently-used (first entry)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(id, { name, expiresAt: Date.now() + this.ttlMs });
    console.error(`[cache] company set id=${id} name=${name ?? 'null'}`);
  }

  /** Seed cache from a pre-fetched array of companies. */
  seed(companies: Array<{ id: number; name: string }>): void {
    for (const c of companies) {
      this.set(c.id, c.name);
    }
  }
}

export class HuduClient {
  private client: AxiosInstance;
  // @MX:NOTE: [AUTO] LRU cache for company name resolution — REQ-07 / BUG-07.
  // Capacity 200, TTL 5 min. Do NOT cache password/credential payloads here.
  private readonly companyCache = new CompanyNameCache(200, 5);

  constructor(config: HuduConfig) {
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout,
    });
  }

  // ---------------------------------------------------------------------------
  // Company name resolution (REQ-07 / BUG-07)
  // ---------------------------------------------------------------------------

  /**
   * Resolve a company name for a given ID.
   *
   * Algorithm:
   * 1. Return cache hit immediately.
   * 2. Fetch GET /companies/{id}, store result, return name.
   * 3. On error, store null (so we don't retry on every call) and return null.
   *
   * IMPORTANT: Call resolveCompanyNames() (batch variant) when hydrating lists
   * to avoid N+1 fetches.
   */
  async resolveCompanyName(companyId: number): Promise<string | null> {
    const cached = this.companyCache.get(companyId);
    if (cached !== undefined) return cached;

    try {
      const response = await this.client.get<{ company: HuduCompany }>(`/companies/${companyId}`);
      const name = response.data.company?.name ?? null;
      this.companyCache.set(companyId, name);
      return name;
    } catch {
      // Store null to prevent repeated failed lookups within TTL
      this.companyCache.set(companyId, null);
      return null;
    }
  }

  /**
   * Batch-resolve company names for a set of IDs.
   *
   * Deduplicates IDs, resolves each missing name once, and updates the cache.
   * Returns a Map<id, name|null> for caller convenience.
   */
  async resolveCompanyNames(companyIds: number[]): Promise<Map<number, string | null>> {
    const result = new Map<number, string | null>();
    const unique = [...new Set(companyIds)];

    await Promise.all(
      unique.map(async (id) => {
        const name = await this.resolveCompanyName(id);
        result.set(id, name);
      })
    );

    return result;
  }

  /**
   * Hydrate company_name on a list of records that each have company_id.
   * Only fetches names for records where company_name is missing or empty.
   * Deduplicates company_id values to avoid N+1 fetches.
   */
  async hydrateCompanyNames<T extends { company_id?: number; company_name?: string }>(
    records: T[]
  ): Promise<T[]> {
    const missingIds = [
      ...new Set(
        records
          .filter((r) => r.company_id && !r.company_name)
          .map((r) => r.company_id as number)
      ),
    ];

    if (missingIds.length === 0) return records;

    const nameMap = await this.resolveCompanyNames(missingIds);

    return records.map((r) => {
      if (r.company_id && !r.company_name) {
        const name = nameMap.get(r.company_id);
        if (name) return { ...r, company_name: name };
      }
      return r;
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
    const articles = response.data.articles;
    // REQ-07 / BUG-07: hydrate company_name for articles that have company_id
    return this.hydrateCompanyNames(articles);
  }

  async getArticle(id: number): Promise<HuduArticle> {
    const response = await this.client.get<{ article: HuduArticle }>(`/articles/${id}`);
    const article = response.data.article;
    // REQ-07 / BUG-07: hydrate company_name for single article
    if (article.company_id && !article.company_name) {
      const name = await this.resolveCompanyName(article.company_id);
      if (name) return { ...article, company_name: name };
    }
    return article;
  }

  async createArticle(article: Partial<HuduArticle>): Promise<HuduArticle> {
    const response = await this.client.post<any>('/articles', { article });
    return response.data?.article ?? response.data;
  }

  async updateArticle(id: number, article: Partial<HuduArticle>): Promise<HuduArticle> {
    const response = await this.client.put<any>(`/articles/${id}`, { article });
    return response.data?.article ?? response.data;
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

  async getAsset(id: number, company_id?: number): Promise<HuduAsset> {
    // Hudu API: prefer nested endpoint GET /companies/{company_id}/assets/{id}.
    // When company_id is unknown, fall back to a filtered list lookup — the
    // flat GET /assets/{id} endpoint returns HTTP 404 on modern API versions.
    if (company_id) {
      const response = await this.client.get<any>(`/companies/${company_id}/assets/${id}`);
      return response.data?.asset ?? response.data;
    }
    const list = await this.client.get<{ assets: HuduAsset[] }>('/assets', { params: { id } });
    const found = (list.data?.assets ?? []).find((a: any) => a.id === id);
    if (found) return found;
    throw new Error(`Asset ${id} not found (tip: pass company_id for direct lookup via /companies/{company_id}/assets/{id})`);
  }

  async createAsset(asset: Partial<HuduAsset>): Promise<HuduAsset> {
    // Hudu API requires nested endpoint: POST /companies/{company_id}/assets.
    // There is NO top-level /assets POST — calling it returns 404.
    if (!asset.company_id) {
      throw new Error('company_id é obrigatório para criar ativos — a API do Hudu usa endpoint aninhado /companies/{company_id}/assets');
    }
    const response = await this.client.post<any>(
      `/companies/${asset.company_id}/assets`,
      { asset }
    );
    return response.data?.asset ?? response.data;
  }

  async updateAsset(id: number, asset: Partial<HuduAsset>): Promise<HuduAsset> {
    // Hudu API uses nested endpoint PUT /companies/{company_id}/assets/{id}.
    // For backwards compatibility, try the flat endpoint first and fall back.
    if (asset.company_id) {
      const response = await this.client.put<any>(
        `/companies/${asset.company_id}/assets/${id}`,
        { asset }
      );
      return response.data?.asset ?? response.data;
    }
    const response = await this.client.put<any>(`/assets/${id}`, { asset });
    return response.data?.asset ?? response.data;
  }

  async deleteAsset(id: number, company_id?: number): Promise<void> {
    // Prefer nested /companies/{company_id}/assets/{id} when company_id is
    // known — the flat /assets/{id} DELETE often returns 404 or 401 on
    // recent Hudu versions.
    if (company_id) {
      await this.client.delete(`/companies/${company_id}/assets/${id}`);
      return;
    }
    await this.client.delete(`/assets/${id}`);
  }

  async archiveAsset(id: number, company_id?: number): Promise<HuduAsset> {
    if (company_id) {
      const response = await this.client.put<any>(`/companies/${company_id}/assets/${id}/archive`);
      return response.data?.asset ?? response.data;
    }
    const response = await this.client.put<any>(`/assets/${id}/archive`);
    return response.data?.asset ?? response.data;
  }

  async unarchiveAsset(id: number, company_id?: number): Promise<HuduAsset> {
    if (company_id) {
      const response = await this.client.put<any>(`/companies/${company_id}/assets/${id}/unarchive`);
      return response.data?.asset ?? response.data;
    }
    const response = await this.client.put<any>(`/assets/${id}/unarchive`);
    return response.data?.asset ?? response.data;
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
    const passwords = response.data.asset_passwords;
    // REQ-07 / BUG-07: hydrate company_name for passwords missing it
    return this.hydrateCompanyNames(passwords);
  }

  async getAssetPassword(id: number): Promise<HuduAssetPassword> {
    const response = await this.client.get<{ asset_password: HuduAssetPassword }>(`/asset_passwords/${id}`);
    const password = response.data.asset_password;
    // REQ-07 / BUG-07: hydrate company_name for single password
    if (password.company_id && !password.company_name) {
      const name = await this.resolveCompanyName(password.company_id);
      if (name) return { ...password, company_name: name };
    }
    return password;
  }

  async createAssetPassword(password: Partial<HuduAssetPassword>): Promise<HuduAssetPassword> {
    const response = await this.client.post<any>('/asset_passwords', { asset_password: password });
    return response.data?.asset_password ?? response.data;
  }

  async updateAssetPassword(id: number, password: Partial<HuduAssetPassword>): Promise<HuduAssetPassword> {
    const response = await this.client.put<any>(`/asset_passwords/${id}`, { asset_password: password });
    return response.data?.asset_password ?? response.data;
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
    const response = await this.client.post<any>('/companies', { company });
    return response.data?.company ?? response.data;
  }

  async updateCompany(id: number, company: Partial<HuduCompany>): Promise<HuduCompany> {
    const response = await this.client.put<any>(`/companies/${id}`, { company });
    return response.data?.company ?? response.data;
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
    const response = await this.client.post<any>('/asset_layouts', { asset_layout: layout });
    return response.data?.asset_layout ?? response.data;
  }

  async updateAssetLayout(id: number, layout: Partial<HuduAssetLayout>): Promise<HuduAssetLayout> {
    const response = await this.client.put<any>(`/asset_layouts/${id}`, { asset_layout: layout });
    return response.data?.asset_layout ?? response.data;
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
    const response = await this.client.get<HuduActivityLog[] | { activity_logs: HuduActivityLog[] }>('/activity_logs', { params });
    return extractArrayResponse(response.data, 'activity_logs');
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
    const folders = response.data.folders;
    // REQ-07/REQ-08 / BUG-07: hydrate company_name for folders
    return this.hydrateCompanyNames(folders);
  }

  async getFolder(id: number): Promise<HuduFolder> {
    const response = await this.client.get<{ folder: HuduFolder }>(`/folders/${id}`);
    const folder = response.data.folder;
    // REQ-07/REQ-08 / BUG-07: hydrate company_name for single folder
    if (folder.company_id && !(folder as any).company_name) {
      const name = await this.resolveCompanyName(folder.company_id);
      if (name) return { ...folder, company_name: name } as HuduFolder & { company_name: string };
    }
    return folder;
  }

  async createFolder(folder: Partial<HuduFolder>): Promise<HuduFolder> {
    const response = await this.client.post<any>('/folders', { folder });
    return response.data?.folder ?? response.data;
  }

  async updateFolder(id: number, folder: Partial<HuduFolder>): Promise<HuduFolder> {
    const response = await this.client.put<any>(`/folders/${id}`, { folder });
    return response.data?.folder ?? response.data;
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
    // Hudu OpenAPI: POST /procedures expects fields at the ROOT level, not
    // wrapped in { procedure: {...} }. Wrapping caused persistent HTTP 422.
    const response = await this.client.post<any>('/procedures', procedure);
    return response.data?.procedure ?? response.data;
  }

  async updateProcedure(id: number, procedure: Partial<HuduProcedure>): Promise<HuduProcedure> {
    const response = await this.client.put<any>(`/procedures/${id}`, procedure);
    return response.data?.procedure ?? response.data;
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
    const response = await this.client.post<any>('/procedure_tasks', { procedure_task: task });
    return response.data?.procedure_task ?? response.data;
  }

  async updateProcedureTask(id: number, task: Partial<HuduProcedureTask>): Promise<HuduProcedureTask> {
    const response = await this.client.put<any>(`/procedure_tasks/${id}`, { procedure_task: task });
    return response.data?.procedure_task ?? response.data;
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
    const response = await this.client.post<any>('/networks', { network });
    return response.data?.network ?? response.data;
  }

  async updateNetwork(id: number, network: Partial<HuduNetwork>): Promise<HuduNetwork> {
    const response = await this.client.put<any>(`/networks/${id}`, { network });
    return response.data?.network ?? response.data;
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
    const response = await this.client.get<HuduWebsite[] | { websites: HuduWebsite[] }>('/websites', { params });
    return extractArrayResponse(response.data, 'websites');
  }

  async getWebsite(id: number): Promise<HuduWebsite> {
    const response = await this.client.get<any>(`/websites/${id}`);
    // API returns raw object directly (not wrapped in { website: {...} })
    return response.data.website || response.data;
  }

  async createWebsite(website: Partial<HuduWebsite>): Promise<HuduWebsite> {
    // Hudu's /websites API returns the raw object directly (not wrapped).
    const response = await this.client.post<any>('/websites', { website });
    return response.data?.website || response.data;
  }

  async updateWebsite(id: number, website: Partial<HuduWebsite>): Promise<HuduWebsite> {
    const response = await this.client.put<any>(`/websites/${id}`, { website });
    return response.data?.website || response.data;
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
    const response = await this.client.post<any>('/vlans', { vlan });
    return response.data?.vlan ?? response.data;
  }

  async updateVlan(id: number, vlan: Partial<HuduVlan>): Promise<HuduVlan> {
    const response = await this.client.put<any>(`/vlans/${id}`, { vlan });
    return response.data?.vlan ?? response.data;
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
    const response = await this.client.post<any>('/vlan_zones', { vlan_zone: zone });
    return response.data?.vlan_zone ?? response.data;
  }

  async updateVlanZone(id: number, zone: Partial<HuduVlanZone>): Promise<HuduVlanZone> {
    const response = await this.client.put<any>(`/vlan_zones/${id}`, { vlan_zone: zone });
    return response.data?.vlan_zone ?? response.data;
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
    const response = await this.client.post<any>('/ip_addresses', { ip_address: ipAddress });
    return response.data?.ip_address ?? response.data;
  }

  async updateIpAddress(id: number, ipAddress: Partial<HuduIpAddress>): Promise<HuduIpAddress> {
    const response = await this.client.put<any>(`/ip_addresses/${id}`, { ip_address: ipAddress });
    return response.data?.ip_address ?? response.data;
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
    const response = await this.client.post<any>('/relations', { relation });
    return response.data?.relation ?? response.data;
  }

  async updateRelation(id: number, relation: Partial<HuduRelation>): Promise<HuduRelation> {
    const response = await this.client.put<any>(`/relations/${id}`, { relation });
    return response.data?.relation ?? response.data;
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
    const response = await this.client.get<HuduMagicDash[] | { magic_dash: HuduMagicDash[] }>('/magic_dash', { params });
    return extractArrayResponse(response.data, 'magic_dash');
  }

  async getMagicDash(id: number): Promise<HuduMagicDash> {
    const response = await this.client.get<{ magic_dash: HuduMagicDash }>(`/magic_dash/${id}`);
    return response.data.magic_dash;
  }

  async createMagicDash(magicDash: Partial<HuduMagicDash>): Promise<HuduMagicDash> {
    // Magic Dash API expects fields at root level, not nested in { magic_dash: {...} }
    const response = await this.client.post<HuduMagicDash | { magic_dash: HuduMagicDash }>('/magic_dash', magicDash);
    const data = response.data;
    if (data && typeof data === 'object' && 'magic_dash' in data) {
      return (data as { magic_dash: HuduMagicDash }).magic_dash;
    }
    return data as HuduMagicDash;
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
    const response = await this.client.get<HuduExpiration[] | { expirations: HuduExpiration[] }>('/expirations', { params });
    return extractArrayResponse(response.data, 'expirations');
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
    // REQ-02 / BUG-02: Guard against HTTP 200 with { rack_storage: null }.
    // The Hudu API may return a 200 with a null wrapper instead of 404 when
    // the record is absent. Without this guard the method silently returns null
    // which propagates as "not found" message in the tool executor.
    const response = await this.client.get<{ rack_storage: HuduRackStorage }>(`/rack_storages/${id}`);
    if (!response.data?.rack_storage) throw new Error(`Rack storage with ID ${id} not found`);
    return response.data.rack_storage;
  }

  async createRackStorage(rackStorage: Partial<HuduRackStorage>): Promise<HuduRackStorage> {
    const response = await this.client.post<any>('/rack_storages', { rack_storage: rackStorage });
    return response.data?.rack_storage ?? response.data;
  }

  async updateRackStorage(id: number, rackStorage: Partial<HuduRackStorage>): Promise<HuduRackStorage> {
    const response = await this.client.put<any>(`/rack_storages/${id}`, { rack_storage: rackStorage });
    return response.data?.rack_storage ?? response.data;
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
    const response = await this.client.post<any>('/rack_storage_items', { rack_storage_item: item });
    return response.data?.rack_storage_item ?? response.data;
  }

  async updateRackStorageItem(id: number, item: Partial<HuduRackStorageItem>): Promise<HuduRackStorageItem> {
    const response = await this.client.put<any>(`/rack_storage_items/${id}`, { rack_storage_item: item });
    return response.data?.rack_storage_item ?? response.data;
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

  // @deprecated /cards/jump and /cards/lookup are integration deep-link endpoints
  // in the Hudu API (they expect integration_slug/integration_type/integration_id
  // from external systems like Syncro/ConnectWise), NOT name-based search.
  // Calling them with `{ name }` returns HTTP 500 or 404. Kept for backwards
  // compatibility with any external code; the MCP navigation tool now uses the
  // regular /companies, /assets and /articles search endpoints.
  async cardJump(params: {
    integration_type?: string;
    integration_slug?: string;
    integration_id?: string;
    integration_identifier?: string;
  }): Promise<HuduCard[]> {
    const response = await this.client.get<HuduCard[] | { cards: HuduCard[] }>('/cards/jump', { params });
    return extractArrayResponse(response.data, 'cards');
  }

  async cardLookup(params: {
    integration_slug: string;
    integration_id?: string;
    integration_identifier?: string;
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

  // @deprecated /companies/jump is an integration deep-link endpoint
  // (requires `integration_slug`). Do NOT use it for name lookups — the MCP
  // navigation tool uses `getCompanies({ name })` instead. Kept only for
  // completeness against the Hudu OpenAPI surface.
  async companyJump(params: {
    integration_slug: string;
  }): Promise<HuduCompany[]> {
    const response = await this.client.get<HuduCompany[] | { companies: HuduCompany[] }>('/companies/jump', { params });
    return extractArrayResponse(response.data, 'companies');
  }

  /**
   * Fetch all records from a paginated endpoint by iterating through pages.
   * Stops when: a page returns fewer items than pageSize, or maxRecords is reached.
   * Safety cap: maximum 20 pages to prevent infinite loops.
   *
   * @param listMethod - Bound list method from this client (e.g., this.getCompanies.bind(this))
   * @param params - Optional filter parameters (page will be overridden)
   * @param maxRecords - Maximum records to collect (default: 500)
   * @param pageSize - Expected page size from API (default: 25)
   * @returns Array of all collected records, truncated to maxRecords
   */
  async fetchAll<T>(
    listMethod: (params: any) => Promise<T[]>,
    params?: Record<string, any>,
    maxRecords: number = 500,
    pageSize: number = 25
  ): Promise<T[]> {
    const allRecords: T[] = [];
    let currentPage = 1;
    const maxPages = Math.ceil(maxRecords / pageSize);
    const safeMaxPages = Math.min(maxPages, 20);

    while (currentPage <= safeMaxPages) {
      const pageParams = { ...params, page: currentPage, page_size: pageSize };
      const results = await listMethod(pageParams);

      allRecords.push(...results);

      if (results.length < pageSize) break;
      if (allRecords.length >= maxRecords) break;

      currentPage++;
    }

    return allRecords.slice(0, maxRecords);
  }
}
