import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

// Global search tool
export const searchTool: Tool = {
  name: 'hudu_search_all_resource_types',
  description: 'Busca global unificada em todos os recursos do Hudu — artigos, ativos, senhas e empresas simultaneamente. Use quando precisar localizar qualquer informação sem saber o tipo exato do recurso no Hudu. Permite filtrar por tipo e company_id. Retorna Markdown consolidado com resultados agrupados por tipo de recurso.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Texto de busca para localizar recursos' },
      type: {
        type: 'string',
        enum: ['articles', 'assets', 'passwords', 'companies'],
        description: 'Tipo de recurso para busca. Valores: articles (artigos da base de conhecimento), assets (ativos de TI), passwords (credenciais armazenadas), companies (empresas cadastradas). Opcional - sem valor busca em todos os tipos simultaneamente'
      },
      company_id: { type: 'number', description: 'Filtrar resultados por ID da empresa' },
      page_size: { type: 'number', minimum: 1, maximum: 25, default: 10, description: 'Quantidade maxima de resultados por tipo de recurso (padrao: 10, maximo: 25)' }
    },
    required: ['query']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution function
export async function executeSearchTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { query, type, company_id } = args;
  
  if (!query || query.trim() === '') {
    return createErrorResponse('Search query is required');
  }
  
  try {
    // Perform search across multiple endpoints based on type
    let results: any = {};
    const pageSize = args.page_size || 10;

    if (!type) {
      // Search all types with page_size limit to prevent token overflow
      const [articles, assets, passwords, companies] = await Promise.allSettled([
        client.getArticles({ search: query, company_id, page_size: pageSize }),
        client.getAssets({ search: query, company_id, page_size: pageSize }),
        client.getAssetPasswords({ search: query, company_id, page_size: pageSize }),
        client.getCompanies({ search: query, page_size: pageSize })
      ]);

      results = {
        articles: articles.status === 'fulfilled' ? articles.value : [],
        assets: assets.status === 'fulfilled' ? assets.value : [],
        passwords: passwords.status === 'fulfilled' ? passwords.value : [],
        companies: companies.status === 'fulfilled' ? companies.value : []
      };
    } else {
      // Search specific type with page_size limit
      switch (type) {
        case 'articles':
          results = await client.getArticles({ search: query, company_id, page_size: pageSize });
          break;
        case 'assets':
          results = await client.getAssets({ search: query, company_id, page_size: pageSize });
          break;
        case 'passwords':
          results = await client.getAssetPasswords({ search: query, company_id, page_size: pageSize });
          break;
        case 'companies':
          results = await client.getCompanies({ search: query, page_size: pageSize });
          break;
        default:
          return createErrorResponse(`Unsupported search type: ${type}`);
      }
    }
    
    // Sanitize results for LLM consumption — keep useful info, reduce noise:
    // 1. Truncate to page_size (API may ignore the parameter)
    // 2. MASK password and otp_secret (NEVER expose secrets in global search context)
    // 3. Simplify custom fields[] to key-value pairs (remove empty values)
    // 4. Truncate HTML content/notes to 300 chars
    // 5. Remove truly useless fields (empty arrays, internal-only IDs)
    const FIELDS_TO_REMOVE = [
      'cards', 'public_photos', 'integrations',                     // almost always empty arrays
      'slug',                                                        // internal Hudu slug
      'passwords_url', 'knowledge_base_url',                        // internal navigation URLs
      'asset_field_id', 'account_id',                               // internal IDs
      'headers', 'cloudflare_details', 'sent_notifications',        // website internals
      'otp_secret',                                                  // secret - mask
      'monitor_type', 'keyword', 'discarded_at', 'potentially_proxied' // website noise
    ];

    const sanitizeItem = (item: any): any => {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(item)) {
        // Skip truly useless fields
        if (FIELDS_TO_REMOVE.includes(key)) continue;

        // MASK password values in global search context
        if (key === 'password') {
          cleaned[key] = '****';
          continue;
        }

        // Simplify custom fields[] — keep only non-empty values as key:value
        if (key === 'fields' && Array.isArray(value)) {
          const simplified = (value as any[])
            .filter((f: any) => f.value !== null && f.value !== undefined && f.value !== '')
            .map((f: any) => ({ label: f.label, value: typeof f.value === 'string' && f.value.length > 100 ? f.value.substring(0, 100) + '...' : f.value }));
          if (simplified.length > 0) {
            cleaned[key] = simplified;
          }
          continue;
        }

        // Truncate HTML content, notes, description to 300 chars
        if ((key === 'content' || key === 'notes' || key === 'description') && typeof value === 'string') {
          const stripped = (value as string).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
          cleaned[key] = stripped.length > 300 ? stripped.substring(0, 300) + '...' : stripped;
          continue;
        }

        cleaned[key] = value;
      }
      return cleaned;
    };

    const sanitizeResults = (items: any[]): any[] => {
      return items.slice(0, pageSize).map(sanitizeItem);
    };

    if (Array.isArray(results)) {
      results = sanitizeResults(results);
    } else if (typeof results === 'object' && results !== null) {
      for (const key of Object.keys(results)) {
        if (Array.isArray(results[key])) {
          results[key] = sanitizeResults(results[key]);
        }
      }
    }

    return createSuccessResponse(results, `Search completed for query: "${query}"`);
  } catch (error: any) {
    return createErrorResponse(`Search operation failed: ${error.message}`);
  }
}