import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const companiesTool: Tool = {
  name: 'hudu_manage_company_information',
  description: 'Empresas, clientes e organizações cadastradas no Hudu — operações CRUD completas incluindo arquivamento. Use quando precisar criar, editar ou excluir registros de contas e empresas clientes no Hudu. Aceita action (create, get, update, delete, archive, unarchive). Retorna JSON com dados da empresa processada.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID), archive (arquivar por ID), unarchive (desarquivar por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da empresa (obrigatório para criação)' },
        nickname: { type: 'string', description: 'Apelido ou nome curto da empresa' },
        company_type: { type: 'string', description: 'Tipo de empresa (ex: cliente, fornecedor, parceiro)' },
        website: { type: 'string', description: 'URL do site da empresa' },
        phone_number: { type: 'string', description: 'Número de telefone principal' },
        address_line_1: { type: 'string', description: 'Endereço linha 1' },
        city: { type: 'string', description: 'Cidade' },
        state: { type: 'string', description: 'Estado ou UF' },
        zip: { type: 'string', description: 'CEP ou código postal' }
      })
    },
    required: ['action']
  }
};

// Companies query tool
export const companiesQueryTool: Tool = {
  name: 'hudu_search_company_information',
  description: 'Empresas, clientes e organizações cadastradas no Hudu — busca e filtragem com paginação por nome. Use quando precisar listar ou localizar contas e empresas clientes sem saber o ID exato no Hudu. Consulta somente leitura. Retorna lista paginada em JSON com dados resumidos das empresas encontradas.',
  inputSchema: createQuerySchema({})
};

// Tool execution functions
export async function executeCompaniesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Company name is required for creating companies');
        }
        const newCompany = await client.createCompany(fields);
        return createSuccessResponse(newCompany, 'Company created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Company ID is required for get operation');
        }
        const company = await client.getCompany(id);
        return createSuccessResponse(company);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Company ID is required for update operation');
        }
        const updatedCompany = await client.updateCompany(id, fields || {});
        return createSuccessResponse(updatedCompany, 'Company updated successfully');
        
      case 'archive':
        if (!id) {
          return createErrorResponse('Company ID is required for archive operation');
        }
        await client.archiveCompany(id);
        return createSuccessResponse(null, 'Company archived successfully');
        
      case 'unarchive':
        if (!id) {
          return createErrorResponse('Company ID is required for unarchive operation');
        }
        await client.unarchiveCompany(id);
        return createSuccessResponse(null, 'Company unarchived successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
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