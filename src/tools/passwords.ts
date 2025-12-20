import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const passwordsTool: Tool = {
  name: 'passwords',
  description: 'Create and manage Hudu passwords and credentials',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Password name' },
        password: { type: 'string', description: 'Password value' },
        username: { type: 'string', description: 'Username' },
        url: { type: 'string', description: 'URL' },
        description: commonProperties.description,
        company_id: commonProperties.company_id,
        passwordable_type: { type: 'string', description: 'Passwordable type' },
        passwordable_id: { type: 'number', description: 'Passwordable ID' }
      })
    },
    required: ['action']
  }
};

// Passwords query tool
export const passwordsQueryTool: Tool = {
  name: 'passwords_query',
  description: 'Search and filter Hudu passwords with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  })
};

// Tool execution functions
export async function executePasswordsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.password) {
          return createErrorResponse('Name and password are required for creating passwords');
        }
        const newPassword = await client.createAssetPassword(fields);
        return createSuccessResponse(newPassword, 'Password created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Password ID is required for get operation');
        }
        const password = await client.getAssetPassword(id);
        return createSuccessResponse(password);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Password ID is required for update operation');
        }
        const updatedPassword = await client.updateAssetPassword(id, fields || {});
        return createSuccessResponse(updatedPassword, 'Password updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Password ID is required for delete operation');
        }
        await client.deleteAssetPassword(id);
        return createSuccessResponse(null, 'Password deleted successfully');
        
      case 'archive':
        if (!id) {
          return createErrorResponse('Password ID is required for archive operation');
        }
        await client.archiveAssetPassword(id);
        return createSuccessResponse(null, 'Password archived successfully');
        
      case 'unarchive':
        if (!id) {
          return createErrorResponse('Password ID is required for unarchive operation');
        }
        await client.unarchiveAssetPassword(id);
        return createSuccessResponse(null, 'Password unarchived successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Passwords operation failed: ${error.message}`);
  }
}

export async function executePasswordsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const passwords = await client.getAssetPasswords(args);
    return createSuccessResponse(passwords);
  } catch (error: any) {
    return createErrorResponse(`Passwords query failed: ${error.message}`);
  }
}