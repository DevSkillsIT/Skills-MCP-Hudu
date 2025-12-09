// Simplified tools for testing the resource+action pattern
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HuduClient } from '../hudu-client.js';

// Tool response interface
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper functions
export function createErrorResponse(error: string): ToolResponse {
  return {
    success: false,
    error
  };
}

export function createSuccessResponse<T>(data: T, message?: string): ToolResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

// Simplified articles tool
export const articlesTool: Tool = {
  name: 'articles',
  description: 'Create and manage Hudu knowledge base articles',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'get', 'update', 'delete', 'archive', 'unarchive'],
        description: 'Action to perform'
      },
      id: {
        type: 'number',
        description: 'Article ID for get/update/delete/archive operations'
      },
      fields: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Article name' },
          content: { type: 'string', description: 'Article content' },
          company_id: { type: 'number', description: 'Company ID' },
          folder_id: { type: 'number', description: 'Folder ID' },
          enable_sharing: { type: 'boolean', description: 'Enable public sharing' }
        },
        description: 'Article data for create/update operations'
      }
    },
    required: ['action']
  }
};

export const articlesQueryTool: Tool = {
  name: 'articles.query',
  description: 'Search and filter Hudu articles with pagination',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search query text' },
      name: { type: 'string', description: 'Filter by name' },
      company_id: { type: 'number', description: 'Company ID' },
      draft: { type: 'boolean', description: 'Filter by draft status' },
      page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
      page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Results per page' }
    }
  }
};

// Simplified companies tool
export const companiesTool: Tool = {
  name: 'companies',
  description: 'Create and manage Hudu companies',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'get', 'update', 'archive', 'unarchive'],
        description: 'Action to perform'
      },
      id: {
        type: 'number',
        description: 'Company ID for get/update/archive operations'
      },
      fields: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company name' },
          nickname: { type: 'string', description: 'Company nickname' },
          company_type: { type: 'string', description: 'Company type' },
          website: { type: 'string', description: 'Company website URL' }
        },
        description: 'Company data for create/update operations'
      }
    },
    required: ['action']
  }
};

export const companiesQueryTool: Tool = {
  name: 'companies.query',
  description: 'Search and filter Hudu companies with pagination',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search query text' },
      name: { type: 'string', description: 'Filter by name' },
      page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
      page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Results per page' }
    }
  }
};

// Admin tool
export const adminTool: Tool = {
  name: 'admin',
  description: 'Administrative operations for Hudu instance management',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_api_info'],
        description: 'Administrative action to perform'
      }
    },
    required: ['action']
  }
};

// Search tool
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

// Simplified tool registry
export const SIMPLIFIED_TOOLS: Record<string, Tool> = {
  'articles': articlesTool,
  'articles.query': articlesQueryTool,
  'companies': companiesTool,
  'companies.query': companiesQueryTool,
  'admin': adminTool,
  'search': searchTool
};

// Execution functions
export async function executeArticlesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'get':
        if (!id) {
          return createErrorResponse('Article ID is required for get operation');
        }
        const article = await client.getArticle(id);
        return createSuccessResponse(article);
        
      case 'create':
        if (!fields?.name || !fields?.content) {
          return createErrorResponse('Name and content are required for creating articles');
        }
        const newArticle = await client.createArticle(fields);
        return createSuccessResponse(newArticle, 'Article created successfully');
        
      default:
        return createErrorResponse(`Action ${action} not yet implemented in simplified version`);
    }
  } catch (error: any) {
    return createErrorResponse(`Articles operation failed: ${error.message}`);
  }
}

export async function executeArticlesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const articles = await client.getArticles(args);
    return createSuccessResponse(articles);
  } catch (error: any) {
    return createErrorResponse(`Articles query failed: ${error.message}`);
  }
}

export async function executeCompaniesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'get':
        if (!id) {
          return createErrorResponse('Company ID is required for get operation');
        }
        const company = await client.getCompany(id);
        return createSuccessResponse(company);
        
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Company name is required for creating companies');
        }
        const newCompany = await client.createCompany(fields);
        return createSuccessResponse(newCompany, 'Company created successfully');
        
      default:
        return createErrorResponse(`Action ${action} not yet implemented in simplified version`);
    }
  } catch (error: any) {
    return createErrorResponse(`Companies operation failed: ${error.message}`);
  }
}

export async function executeCompaniesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const companies = await client.getCompanies(args);
    return createSuccessResponse(companies);
  } catch (error: any) {
    return createErrorResponse(`Companies query failed: ${error.message}`);
  }
}

export async function executeAdminTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action } = args;
  
  try {
    switch (action) {
      case 'get_api_info':
        const apiInfo = await client.getApiInfo();
        return createSuccessResponse(apiInfo, 'API information retrieved successfully');
        
      default:
        return createErrorResponse(`Unknown admin action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Admin operation failed: ${error.message}`);
  }
}

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
    
    // For now, use getArticles as a placeholder for search
    const results = await client.getArticles({ search: query });
    
    return createSuccessResponse(results, `Search completed for query: "${query}"`);
  } catch (error: any) {
    return createErrorResponse(`Search operation failed: ${error.message}`);
  }
}

// Simplified tool executors
export const SIMPLIFIED_TOOL_EXECUTORS: Record<string, Function> = {
  'articles': executeArticlesTool,
  'articles.query': executeArticlesQueryTool,
  'companies': executeCompaniesTool,
  'companies.query': executeCompaniesQueryTool,
  'admin': executeAdminTool,
  'search': executeSearchTool
};