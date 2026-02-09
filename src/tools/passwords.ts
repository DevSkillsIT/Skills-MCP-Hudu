import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const passwordsTool: Tool = {
  name: 'hudu_manage_password_credentials',
  description: 'Senhas, credenciais e acessos armazenados no cofre do Hudu — operações CRUD completas incluindo arquivamento. Use quando precisar cadastrar, editar ou excluir logins e chaves de acesso no Hudu. Requer permissões elevadas de API. Aceita action (create, get, update, delete, archive, unarchive). Retorna JSON.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID), archive (arquivar por ID), unarchive (desarquivar por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome identificador da credencial (obrigatório para criação)' },
        password: { type: 'string', description: 'Valor da senha (obrigatório para criação)' },
        username: { type: 'string', description: 'Nome de usuário ou login associado' },
        url: { type: 'string', description: 'URL do serviço ou sistema relacionado' },
        description: commonProperties.description,
        company_id: commonProperties.company_id,
        passwordable_type: { type: 'string', description: 'Tipo do recurso pai vinculado à credencial' },
        passwordable_id: { type: 'number', description: 'ID do recurso pai vinculado à credencial' }
      })
    },
    required: ['action']
  }
};

// Passwords query tool
export const passwordsQueryTool: Tool = {
  name: 'hudu_search_password_credentials',
  description: 'Senhas, credenciais e acessos armazenados no cofre do Hudu — busca e filtragem com paginação. Use quando precisar localizar logins ou chaves de acesso por texto ou empresa no Hudu. Requer permissões elevadas de API. Consulta somente leitura. Retorna lista paginada em JSON com metadados das credenciais.',
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