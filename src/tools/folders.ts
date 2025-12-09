import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

/**
 * Folders resource tool - CRUD operations for Hudu folders
 * Folders are used to organize knowledge base articles
 */
export const foldersTool: Tool = {
  name: 'folders',
  description: 'Create and manage Hudu folders for organizing knowledge base articles',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(['create', 'get', 'update', 'delete']),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Folder name (required for create)' },
        icon: { type: 'string', description: 'Folder icon (Font Awesome class)' },
        description: commonProperties.description,
        parent_folder_id: { type: 'number', description: 'Parent folder ID for nested folders' },
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  }
};

/**
 * Folders query tool - Search and filter folders with pagination
 */
export const foldersQueryTool: Tool = {
  name: 'folders.query',
  description: 'Search and filter Hudu folders with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  })
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
