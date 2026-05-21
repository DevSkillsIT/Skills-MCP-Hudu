import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

/**
 * Folders resource tool - CRUD operations for Hudu folders
 * Folders are used to organize knowledge base articles
 */
export const foldersTool: Tool = {
  name: 'hudu_manage_kb_article_folders',
  description: 'Pastas, diretórios e categorias de organização da base de conhecimento no Hudu — operações CRUD com suporte a hierarquia. Use quando precisar criar, editar ou excluir pastas para estruturar artigos no Hudu. Suporta aninhamento via parent_folder_id. Aceita action (create, get, update, delete). Retorna Markdown da pasta.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(['create', 'get', 'update', 'delete'], 'Ação a executar. Valores: create (criar nova pasta), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da pasta (obrigatório para criação)' },
        icon: { type: 'string', description: 'Ícone da pasta (classe Font Awesome, ex: fa-folder)' },
        description: commonProperties.description,
        parent_folder_id: { type: 'number', description: 'ID da pasta pai para criar hierarquia aninhada' },
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

/**
 * Folders query tool - Search and filter folders with pagination
 */
export const foldersQueryTool: Tool = {
  name: 'hudu_search_kb_article_folders',
  description: 'Pastas, diretórios e categorias de organização da base de conhecimento no Hudu — busca e filtragem com paginação. Use quando precisar listar a estrutura de pastas que organizam artigos por empresa no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados das pastas encontradas.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

/**
 * Execute folders CRUD operations
 */
export async function executeFoldersTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;

  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Name is required for creating folders');
        }
        const newFolder = await client.createFolder(fields);
        return createSuccessResponse(newFolder, 'Folder created successfully');

      case 'get':
        if (!id) {
          return createErrorResponse('Folder ID is required for get operation');
        }
        const folder = await client.getFolder(id);
        return createSuccessResponse(folder);

      case 'update':
        if (!id) {
          return createErrorResponse('Folder ID is required for update operation');
        }
        const updatedFolder = await client.updateFolder(id, fields || {});
        return createSuccessResponse(updatedFolder, 'Folder updated successfully');

      case 'delete':
        if (!id) {
          return createErrorResponse('Folder ID is required for delete operation');
        }
        await client.deleteFolder(id);
        return createSuccessResponse(null, 'Folder deleted successfully');

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Folders operation failed: ${error.message}`);
  }
}

/**
 * Execute folders query operation
 */
export async function executeFoldersQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const folders = await client.getFolders(args);
    return createSuccessResponse(folders);
  } catch (error: any) {
    return createErrorResponse(`Folders query failed: ${error.message}`);
  }
}
