import { HuduClient } from './hudu-client.js';
import winston from 'winston';
import {
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
  HuduLabel,
  HuduLabelType,
  HuduFlag,
  HuduFlagType
} from './types.js';

/**
 * FilteredHuduClient - Wrapper que injeta filtros de company_id automaticamente
 * 
 * Este client envolve o HuduClient original e adiciona filtros de company_id
 * em todas as chamadas que suportam esse parâmetro, baseado na configuração
 * de empresas permitidas via variável de ambiente.
 */
export class FilteredHuduClient {
  private wrappedClient: HuduClient;
  private allowedCompanyIds: string[];
  private isAllAccess: boolean;
  private logger: winston.Logger;
  private readonly MAX_COMPANIES = 10; // Safety limit to prevent performance issues

  constructor(wrappedClient: HuduClient, allowedCompanyIds: string[], logger?: winston.Logger) {
    this.wrappedClient = wrappedClient;
    this.allowedCompanyIds = allowedCompanyIds;
    this.isAllAccess = allowedCompanyIds.includes('ALL');
    
    // Use provided logger or create default one
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  }

  /**
   * Helper para injetar company_id nos parâmetros (API aceita apenas um ID por requisição)
   */
  private injectCompanyFilter(params?: any, companyId?: string): any {
    if (!params) params = {};
    
    // Se ALL access, não injeta filtro
    if (this.isAllAccess) {
      return params;
    }
    
    // Se já tem company_id, respeita o filtro específico
    if (params.company_id) {
      return params;
    }
    
    // Injeta filtro da empresa específica (para requisições individuais)
    if (companyId) {
      params.company_id = parseInt(companyId);
      return params;
    }
    
    // Se múltiplos IDs permitidos, não injeta nada aqui (será tratado no método específico)
    if (this.allowedCompanyIds.length > 1) {
      return params;
    }
    
    // Se apenas um ID permitido, injeta-o
    if (this.allowedCompanyIds.length === 1) {
      params.company_id = parseInt(this.allowedCompanyIds[0]!);
      return params;
    }
    
    return params;
  }

  /**
   * Executa múltiplas requisições para diferentes company_ids e mescla os resultados
   */
  private async executeWithMultipleCompanies<T>(
    operation: (companyId: string) => Promise<T[]>,
    params?: any
  ): Promise<T[]> {
    if (this.allowedCompanyIds.length === 0) {
      return [];
    }
    
    // Se apenas um company_id, executa diretamente
    if (this.allowedCompanyIds.length === 1) {
      return operation(this.allowedCompanyIds[0]!);
    }
    
    // Executa em paralelo para múltiplos company_ids
    const promises = this.allowedCompanyIds.map(companyId => 
      operation(companyId).catch(error => {
        this.logger.warn(`Failed to fetch data for company ${companyId}:`, { 
          error: error.message,
          companyId 
        });
        return [] as T[];
      })
    );
    
    const results = await Promise.all(promises);
    
    // Mescla todos os resultados
    const merged = results.flat();
    
    // Remove duplicatas baseadas no ID (se existir)
    const unique = merged.filter((item, index, self) => {
      if (!item || typeof item !== 'object') return true;
      const id = (item as any).id;
      return id === undefined || self.findIndex(i => i && typeof i === 'object' && (i as any).id === id) === index;
    });
    
    return unique;
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
    // Se ALL access ou apenas um company_id, usa lógica simples
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getArticles(this.injectCompanyFilter(params));
    }
    
    // Para múltiplos company_ids, executa em paralelo
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getArticles(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getArticle(id: number): Promise<HuduArticle> {
    return this.wrappedClient.getArticle(id);
  }

  async createArticle(article: Partial<HuduArticle>): Promise<HuduArticle> {
    return this.wrappedClient.createArticle(article);
  }

  async updateArticle(id: number, article: Partial<HuduArticle>): Promise<HuduArticle> {
    return this.wrappedClient.updateArticle(id, article);
  }

  async deleteArticle(id: number): Promise<void> {
    return this.wrappedClient.deleteArticle(id);
  }

  // Assets
  async getAssets(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    serial_number?: string;
    asset_layout_id?: number;
    asset_tag?: string;
    updated_at?: string;
  }): Promise<HuduAsset[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getAssets(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getAssets(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getAsset(id: number): Promise<HuduAsset> {
    return this.wrappedClient.getAsset(id);
  }

  async createAsset(asset: Partial<HuduAsset>): Promise<HuduAsset> {
    return this.wrappedClient.createAsset(asset);
  }

  async updateAsset(id: number, asset: Partial<HuduAsset>): Promise<HuduAsset> {
    return this.wrappedClient.updateAsset(id, asset);
  }

  async deleteAsset(id: number): Promise<void> {
    return this.wrappedClient.deleteAsset(id);
  }

  // Asset Passwords
  async getAssetPasswords(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    asset_id?: number;
    password_folder_id?: number;
    updated_at?: string;
  }): Promise<HuduAssetPassword[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getAssetPasswords(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getAssetPasswords(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getAssetPassword(id: number): Promise<HuduAssetPassword> {
    return this.wrappedClient.getAssetPassword(id);
  }

  async createAssetPassword(password: Partial<HuduAssetPassword>): Promise<HuduAssetPassword> {
    return this.wrappedClient.createAssetPassword(password);
  }

  async updateAssetPassword(id: number, password: Partial<HuduAssetPassword>): Promise<HuduAssetPassword> {
    return this.wrappedClient.updateAssetPassword(id, password);
  }

  async deleteAssetPassword(id: number): Promise<void> {
    return this.wrappedClient.deleteAssetPassword(id);
  }

  // Companies
  async getCompanies(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduCompany[]> {
    // For companies, we need special handling since filtering by company_id is circular logic
    // Fetch all companies first, then filter results post-fetch
    const allCompanies = await this.wrappedClient.getCompanies(params);
    
    if (this.isAllAccess) {
      return allCompanies;
    }
    
    // Filter companies to only include allowed company IDs
    const allowedIds = this.allowedCompanyIds.map(id => parseInt(id));
    const filteredCompanies = allCompanies.filter(company => 
      allowedIds.includes(company.id)
    );
    
    this.logger.debug(`Filtered companies from ${allCompanies.length} to ${filteredCompanies.length} based on allowed company IDs`, {
      allowedCompanyIds: allowedIds,
      originalCount: allCompanies.length,
      filteredCount: filteredCompanies.length
    });
    
    return filteredCompanies;
  }

  async getCompany(id: number): Promise<HuduCompany> {
    return this.wrappedClient.getCompany(id);
  }

  async createCompany(company: Partial<HuduCompany>): Promise<HuduCompany> {
    return this.wrappedClient.createCompany(company);
  }

  async updateCompany(id: number, company: Partial<HuduCompany>): Promise<HuduCompany> {
    return this.wrappedClient.updateCompany(id, company);
  }

  
  // Asset Layouts
  async getAssetLayouts(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduAssetLayout[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getAssetLayouts(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getAssetLayouts(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getAssetLayout(id: number): Promise<HuduAssetLayout> {
    return this.wrappedClient.getAssetLayout(id);
  }

  // Activity Logs
  async getActivityLogs(params?: {
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduActivityLog[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getActivityLogs(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getActivityLogs(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  
  // Folders
  async getFolders(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduFolder[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getFolders(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getFolders(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getFolder(id: number): Promise<HuduFolder> {
    return this.wrappedClient.getFolder(id);
  }

  // Users
  async getUsers(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduUser[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getUsers(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getUsers(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getUser(id: number): Promise<HuduUser> {
    return this.wrappedClient.getUser(id);
  }

  // Procedures
  async getProcedures(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduProcedure[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getProcedures(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getProcedures(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getProcedure(id: number): Promise<HuduProcedure> {
    return this.wrappedClient.getProcedure(id);
  }

  // Procedure Tasks
  async getProcedureTasks(params?: {
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduProcedureTask[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getProcedureTasks(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getProcedureTasks(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getProcedureTask(id: number): Promise<HuduProcedureTask> {
    return this.wrappedClient.getProcedureTask(id);
  }

  // Networks
  async getNetworks(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduNetwork[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getNetworks(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getNetworks(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getNetwork(id: number): Promise<HuduNetwork> {
    return this.wrappedClient.getNetwork(id);
  }

  // Password Folders
  async getPasswordFolders(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduPasswordFolder[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getPasswordFolders(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getPasswordFolders(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getPasswordFolder(id: number): Promise<HuduPasswordFolder> {
    return this.wrappedClient.getPasswordFolder(id);
  }

  // Uploads
  async getUploads(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduUpload[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getUploads(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getUploads(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getUpload(id: number): Promise<HuduUpload> {
    return this.wrappedClient.getUpload(id);
  }

  // Websites
  async getWebsites(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduWebsite[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getWebsites(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getWebsites(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getWebsite(id: number): Promise<HuduWebsite> {
    return this.wrappedClient.getWebsite(id);
  }

  // Vlans
  async getVlans(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduVlan[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getVlans(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getVlans(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getVlan(id: number): Promise<HuduVlan> {
    return this.wrappedClient.getVlan(id);
  }

  // Vlan Zones
  async getVlanZones(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduVlanZone[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getVlanZones(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getVlanZones(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getVlanZone(id: number): Promise<HuduVlanZone> {
    return this.wrappedClient.getVlanZone(id);
  }

  // IP Addresses
  async getIpAddresses(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduIpAddress[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getIpAddresses(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getIpAddresses(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getIpAddress(id: number): Promise<HuduIpAddress> {
    return this.wrappedClient.getIpAddress(id);
  }

  // Relations
  async getRelations(params?: {
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduRelation[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getRelations(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getRelations(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getRelation(id: number): Promise<HuduRelation> {
    return this.wrappedClient.getRelation(id);
  }

  // Lists
  async getLists(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduList[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getLists(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getLists(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getList(id: number): Promise<HuduList> {
    return this.wrappedClient.getList(id);
  }

  // Groups
  async getGroups(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduGroup[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getGroups(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getGroups(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getGroup(id: number): Promise<HuduGroup> {
    return this.wrappedClient.getGroup(id);
  }

  // Magic Dashes
  async getMagicDashes(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduMagicDash[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getMagicDashes(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getMagicDashes(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getMagicDash(id: number): Promise<HuduMagicDash> {
    return this.wrappedClient.getMagicDash(id);
  }

  // Matchers
  async getMatchers(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduMatcher[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getMatchers(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getMatchers(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getMatcher(id: number): Promise<HuduMatcher> {
    return this.wrappedClient.getMatcher(id);
  }

  // Expirations
  async getExpirations(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduExpiration[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getExpirations(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getExpirations(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  
  // Exports
  async getExports(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduExport[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getExports(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getExports(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  
  // Rack Storages
  async getRackStorages(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduRackStorage[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getRackStorages(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getRackStorages(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getRackStorage(id: number): Promise<HuduRackStorage> {
    return this.wrappedClient.getRackStorage(id);
  }

  // Rack Storage Items
  async getRackStorageItems(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduRackStorageItem[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getRackStorageItems(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getRackStorageItems(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getRackStorageItem(id: number): Promise<HuduRackStorageItem> {
    return this.wrappedClient.getRackStorageItem(id);
  }

  // Public Photos
  async getPublicPhotos(params?: {
    name?: string;
    company_id?: number;
    page?: number;
    page_size?: number;
    search?: string;
    updated_at?: string;
  }): Promise<HuduPublicPhoto[]> {
    if (this.isAllAccess || this.allowedCompanyIds.length <= 1) {
      return this.wrappedClient.getPublicPhotos(this.injectCompanyFilter(params));
    }
    
    return this.executeWithMultipleCompanies(
      (companyId) => this.wrappedClient.getPublicPhotos(this.injectCompanyFilter(params, companyId)),
      params
    );
  }

  async getPublicPhoto(id: number): Promise<HuduPublicPhoto> {
    return this.wrappedClient.getPublicPhoto(id);
  }

  async createPublicPhoto(photo: Partial<HuduPublicPhoto>): Promise<HuduPublicPhoto> {
    return this.wrappedClient.createPublicPhoto(photo);
  }

  async updatePublicPhoto(id: number, photo: Partial<HuduPublicPhoto>): Promise<HuduPublicPhoto> {
    return this.wrappedClient.updatePublicPhoto(id, photo);
  }

  async deletePublicPhoto(id: number): Promise<void> {
    return this.wrappedClient.deletePublicPhoto(id);
  }

  // Utility methods
  async getApiInfo(): Promise<{ version: string; date: string }> {
    return this.wrappedClient.getApiInfo();
  }

  async getCompanyAssets(companyId: number, params?: {
    name?: string;
    page?: number;
    page_size?: number;
    search?: string;
    serial_number?: string;
    asset_layout_id?: number;
    asset_tag?: string;
    updated_at?: string;
  }): Promise<HuduAsset[]> {
    return this.wrappedClient.getCompanyAssets(companyId, params);
  }

  async getCompanyAsset(companyId: number, assetId: number): Promise<HuduAsset> {
    return this.wrappedClient.getCompanyAsset(companyId, assetId);
  }

  // -------------------------------------------------------------------------
  // Labels and flags
  //
  // These endpoints take no company_id, so injectCompanyFilter has nothing to
  // act on: a Label is `{label_type_id, labelable_type, labelable_id}` and the
  // company is only reachable through the labelled record. Scoping therefore
  // falls to the Hudu API key itself — `Api::V1::LabelsController` narrows to
  // `Label.for_company(@api_key.company.id)` when the key is company-scoped.
  //
  // The consequence is worth stating plainly: with a global API key and a
  // non-ALL HUDU_ALLOWED_COMPANY_IDS, these calls are NOT restricted by the
  // MCP allowlist. Use a company-scoped Hudu API key for that deployment.
  // -------------------------------------------------------------------------

  private warnedUnscoped = false;

  /**
   * Message for tools whose endpoints cannot honour the company allowlist, or
   * null when there is nothing to warn about.
   *
   * The log warning alone was not a defence: `FilteredHuduClient` is built once
   * per process, so `warnedUnscoped` latches and under pm2 the line appears
   * once in weeks of uptime — while every response continues to look clean.
   * The caller has to see this in the answer it is reading.
   */
  scopeWarningForUnscopedEndpoints(): string | null {
    if (this.isAllAccess) return null;
    return (
      'ATENÇÃO: etiquetas e sinalizações não aceitam filtro por empresa na API do Hudu, ' +
      `então o allowlist deste MCP (${this.allowedCompanyIds.join(', ')}) NÃO foi aplicado aqui. ` +
      'Estes resultados podem incluir registros de outras empresas. Confirme a empresa de cada ' +
      'registro antes de repassar.'
    );
  }

  private warnUnscoped(method: string): void {
    if (this.isAllAccess || this.warnedUnscoped) return;
    this.warnedUnscoped = true;
    this.logger.warn(
      'Label/flag endpoints carry no company_id and cannot honour HUDU_ALLOWED_COMPANY_IDS. ' +
        'Scoping depends on the Hudu API key. Use a company-scoped key for filtered deployments.',
      { method, allowedCompanyIds: this.allowedCompanyIds }
    );
  }

  async getLabelTypes(params?: Parameters<HuduClient['getLabelTypes']>[0]): Promise<HuduLabelType[]> {
    return this.wrappedClient.getLabelTypes(params);
  }

  async getLabelType(id: number): Promise<HuduLabelType> {
    return this.wrappedClient.getLabelType(id);
  }

  async createLabelType(labelType: Partial<HuduLabelType>): Promise<HuduLabelType> {
    return this.wrappedClient.createLabelType(labelType);
  }

  async updateLabelType(id: number, labelType: Partial<HuduLabelType>): Promise<HuduLabelType> {
    return this.wrappedClient.updateLabelType(id, labelType);
  }

  async deleteLabelType(id: number): Promise<void> {
    return this.wrappedClient.deleteLabelType(id);
  }

  async getLabels(params?: Parameters<HuduClient['getLabels']>[0]): Promise<HuduLabel[]> {
    this.warnUnscoped('getLabels');
    return this.wrappedClient.getLabels(params);
  }

  async getLabel(id: number): Promise<HuduLabel> {
    this.warnUnscoped('getLabel');
    return this.wrappedClient.getLabel(id);
  }

  async createLabel(label: Partial<HuduLabel>): Promise<HuduLabel> {
    this.warnUnscoped('createLabel');
    return this.wrappedClient.createLabel(label);
  }

  async updateLabel(id: number, label: Partial<HuduLabel>): Promise<HuduLabel> {
    this.warnUnscoped('updateLabel');
    return this.wrappedClient.updateLabel(id, label);
  }

  async deleteLabel(id: number): Promise<void> {
    this.warnUnscoped('deleteLabel');
    return this.wrappedClient.deleteLabel(id);
  }

  async getFlagTypes(params?: Parameters<HuduClient['getFlagTypes']>[0]): Promise<HuduFlagType[]> {
    return this.wrappedClient.getFlagTypes(params);
  }

  async getFlagType(id: number): Promise<HuduFlagType> {
    return this.wrappedClient.getFlagType(id);
  }

  async createFlagType(flagType: Partial<HuduFlagType>): Promise<HuduFlagType> {
    return this.wrappedClient.createFlagType(flagType);
  }

  async updateFlagType(id: number, flagType: Partial<HuduFlagType>): Promise<HuduFlagType> {
    return this.wrappedClient.updateFlagType(id, flagType);
  }

  async deleteFlagType(id: number): Promise<void> {
    return this.wrappedClient.deleteFlagType(id);
  }

  async getFlags(params?: Parameters<HuduClient['getFlags']>[0]): Promise<HuduFlag[]> {
    this.warnUnscoped('getFlags');
    return this.wrappedClient.getFlags(params);
  }

  async getFlag(id: number): Promise<HuduFlag> {
    this.warnUnscoped('getFlag');
    return this.wrappedClient.getFlag(id);
  }

  async createFlag(flag: Partial<HuduFlag>): Promise<HuduFlag> {
    this.warnUnscoped('createFlag');
    return this.wrappedClient.createFlag(flag);
  }

  async updateFlag(id: number, flag: Partial<HuduFlag>): Promise<HuduFlag> {
    this.warnUnscoped('updateFlag');
    return this.wrappedClient.updateFlag(id, flag);
  }

  async deleteFlag(id: number): Promise<void> {
    this.warnUnscoped('deleteFlag');
    return this.wrappedClient.deleteFlag(id);
  }
}
