import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const articlesTool: Tool = {
  name: 'hudu_manage_knowledge_articles',
  description: 'Artigos, documentos e procedimentos da base de conhecimento no Hudu — operações CRUD completas incluindo arquivamento. Use quando precisar criar, editar ou excluir artigos técnicos, guias e runbooks no Hudu. Aceita action (create, get, update, delete, archive, unarchive). Retorna JSON com dados do artigo.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID), archive (arquivar por ID), unarchive (desarquivar por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do artigo (obrigatório para criação)' },
        content: { type: 'string', description: 'Conteúdo do artigo em HTML ou Markdown' },
        company_id: commonProperties.company_id,
        folder_id: commonProperties.folder_id,
        enable_sharing: { type: 'boolean', description: 'Habilitar compartilhamento público do artigo' }
      })
    },
    required: ['action']
  }
};

// Articles query tool
export const articlesQueryTool: Tool = {
  name: 'hudu_search_knowledge_articles',
  description: 'Artigos, documentos e procedimentos da base de conhecimento no Hudu — busca e filtragem com paginação. Use quando precisar localizar guias, runbooks ou documentação técnica por texto ou empresa no Hudu. Consulta somente leitura. Retorna lista paginada em JSON com metadados dos artigos encontrados.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id,
    draft: { type: 'boolean', description: 'Filtrar por status de rascunho (true = apenas rascunhos)' }
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