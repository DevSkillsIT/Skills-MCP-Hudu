import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Websites manage tool (CRUD)
export const websitesTool: Tool = {
  name: 'hudu_manage_website_monitoring',
  description: 'Sites, portais e URLs monitorados no Hudu — operacoes CRUD para registros de monitoramento de website. Use quando precisar cadastrar, editar, consultar ou excluir sites monitorados vinculados a empresas no Hudu. Aceita action (create, get, update, delete). Retorna Markdown com dados do site processado.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Acao a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'URL do website para monitoramento, ex: https://exemplo.com (obrigatorio para criacao). No Hudu, o campo name recebe a URL do site.' },
        company_id: { ...commonProperties.company_id, description: 'ID da empresa associada (OBRIGATORIO para criacao)' },
        disable_dns: { type: 'boolean', description: 'Desabilitar verificacao de DNS' },
        disable_ssl: { type: 'boolean', description: 'Desabilitar verificacao de certificado SSL' },
        disable_whois: { type: 'boolean', description: 'Desabilitar verificacao de WHOIS e expiracao de dominio' },
        paused: { type: 'boolean', description: 'Pausar monitoramento do site' },
        notes: { type: 'string', description: 'Observacoes e notas sobre o site' }
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

// Websites query tool
export const websitesQueryTool: Tool = {
  name: 'hudu_search_website_monitoring',
  description: 'Sites, portais e URLs monitorados no Hudu — busca e filtragem com paginacao por nome e empresa. Use quando precisar listar ou localizar registros de monitoramento de websites sem saber o ID exato no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com dados resumidos dos sites encontrados.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution functions
export async function executeWebsitesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;

  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Website name (URL) is required for creating websites. The name field should contain the website URL (e.g. https://example.com)');
        }
        if (!fields?.company_id) {
          return createErrorResponse('company_id is required for creating websites');
        }
        // Hudu API: 'name' is the website URL. Remove 'url' field to avoid 422.
        const { url: _url, ...createFields } = fields;
        const newWebsite = await client.createWebsite(createFields);
        return createSuccessResponse(newWebsite, 'Website created successfully');

      case 'get':
        if (!id) {
          return createErrorResponse('Website ID is required for get operation');
        }
        const website = await client.getWebsite(id);
        return createSuccessResponse(website);

      case 'update':
        if (!id) {
          return createErrorResponse('Website ID is required for update operation');
        }
        // Remove 'url' field if present to avoid 422 - Hudu uses 'name' as the URL
        const { url: _updateUrl, ...updateFields } = fields || {};
        const updatedWebsite = await client.updateWebsite(id, updateFields);
        return createSuccessResponse(updatedWebsite, 'Website updated successfully');

      case 'delete':
        if (!id) {
          return createErrorResponse('Website ID is required for delete operation');
        }
        await client.deleteWebsite(id);
        return createSuccessResponse(null, 'Website deleted successfully');

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Websites operation failed: ${error.message}`);
  }
}

export async function executeWebsitesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const websites = await client.getWebsites(args);
    return createSuccessResponse(websites);
  } catch (error: any) {
    return createErrorResponse(`Websites query failed: ${error.message}`);
  }
}
