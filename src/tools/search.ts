import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

// Global search tool
export const searchTool: Tool = {
  name: 'search',
  description: 'Global search across all Hudu content types',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query text' },
      type: { 
        type: 'string', 
        enum: ['articles', 'assets', 'passwords', 'companies'], 
        description: 'Specific content type to search' 
      },
      company_id: { type: 'number', description: 'Filter results by company ID' }
    },
    required: ['query']
  }
};

// Tool execution function
export async function executeSearchTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { query, type, company_id } = args;
  
  if (!query || query.trim() === '') {
    return createErrorResponse('Search query is required');
  }
  
  try {
    const searchParams = {
      query: query.trim(),
      type,
      company_id
    };
    
    // Perform search across multiple endpoints based on type
    let results: any = {};
    
    if (!type) {
      // Search all types
      const [articles, assets, passwords, companies] = await Promise.allSettled([
        client.getArticles({ search: query, company_id }),
        client.getAssets({ search: query, company_id }),
        client.getAssetPasswords({ search: query, company_id }),
        client.getCompanies({ search: query })
      ]);
      
      results = {
        articles: articles.status === 'fulfilled' ? articles.value : [],
        assets: assets.status === 'fulfilled' ? assets.value : [],
        passwords: passwords.status === 'fulfilled' ? passwords.value : [],
        companies: companies.status === 'fulfilled' ? companies.value : []
      };
    } else {
      // Search specific type
      switch (type) {
        case 'articles':
          results = await client.getArticles({ search: query, company_id });
          break;
        case 'assets':
          results = await client.getAssets({ search: query, company_id });
          break;
        case 'passwords':
          results = await client.getAssetPasswords({ search: query, company_id });
          break;
        case 'companies':
          results = await client.getCompanies({ search: query });
          break;
        default:
          return createErrorResponse(`Unsupported search type: ${type}`);
      }
    }
    
    return createSuccessResponse(results, `Search completed for query: "${query}"`);
  } catch (error: any) {
    return createErrorResponse(`Search operation failed: ${error.message}`);
  }
}