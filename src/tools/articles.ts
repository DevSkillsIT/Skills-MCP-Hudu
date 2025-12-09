import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const articlesTool: Tool = {
  name: 'articles',
  description: 'Create and manage Hudu knowledge base articles',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Article name' },
        content: { type: 'string', description: 'Article content (HTML/Markdown)' },
        company_id: commonProperties.company_id,
        folder_id: commonProperties.folder_id,
        enable_sharing: { type: 'boolean', description: 'Enable public sharing' }
      })
    },
    required: ['action']
  }
};

// Articles query tool
export const articlesQueryTool: Tool = {
  name: 'articles.query',
  description: 'Search and filter Hudu articles with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id,
    draft: { type: 'boolean', description: 'Filter by draft status' }
  })
};

// Tool execution functions
export async function executeArticlesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.content) {
          return createErrorResponse('Name and content are required for creating articles');
        }
        const newArticle = await client.createArticle(fields);
        return createSuccessResponse(newArticle, 'Article created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Article ID is required for get operation');
        }
        const article = await client.getArticle(id);
        return createSuccessResponse(article);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Article ID is required for update operation');
        }
        const updatedArticle = await client.updateArticle(id, fields || {});
        return createSuccessResponse(updatedArticle, 'Article updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Article ID is required for delete operation');
        }
        await client.deleteArticle(id);
        return createSuccessResponse(null, 'Article deleted successfully');
        
      case 'archive':
        if (!id) {
          return createErrorResponse('Article ID is required for archive operation');
        }
        await client.archiveArticle(id);
        return createSuccessResponse(null, 'Article archived successfully');
        
      case 'unarchive':
        if (!id) {
          return createErrorResponse('Article ID is required for unarchive operation');
        }
        await client.unarchiveArticle(id);
        return createSuccessResponse(null, 'Article unarchived successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
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