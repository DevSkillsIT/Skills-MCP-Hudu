import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const assetsTool: Tool = {
  name: 'hudu_manage_it_asset_inventory',
  description: 'Ativos de TI, equipamentos e dispositivos no inventário do Hudu — operações CRUD completas incluindo arquivamento. Use quando precisar cadastrar, editar ou excluir servidores, estações e hardware no Hudu. Requer company_id e asset_layout_id para criação. Aceita action (create, get, update, delete, archive, unarchive). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID), archive (arquivar por ID), unarchive (desarquivar por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do ativo (obrigatório para criação)' },
        asset_type: { type: 'string', description: 'Tipo do ativo (ex: servidor, estação, switch)' },
        company_id: { ...commonProperties.company_id, description: 'ID da empresa associada (obrigatório para criação)' },
        asset_layout_id: { type: 'number', description: 'ID do layout de ativo (obrigatório para criação)' },
        fields: { type: 'array', items: {}, description: 'Valores dos campos personalizados conforme o layout do ativo' }
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

// Assets query tool
export const assetsQueryTool: Tool = {
  name: 'hudu_search_it_asset_inventory',
  description: 'Ativos de TI, equipamentos e dispositivos no inventário do Hudu — busca e filtragem com paginação. Use quando precisar localizar servidores, estações ou hardware por texto, empresa ou layout no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados dos ativos encontrados.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id,
    asset_layout_id: { type: 'number', description: 'Filtrar por ID do layout de ativo' },
    archived: { type: 'boolean', description: 'Incluir ativos arquivados nos resultados' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution functions
export async function executeAssetsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.company_id || !fields?.asset_layout_id) {
          return createErrorResponse('Name, company_id, and asset_layout_id are required for creating assets');
        }
        const newAsset = await client.createAsset(fields);
        return createSuccessResponse(newAsset, 'Asset created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Asset ID is required for get operation');
        }
        const asset = await client.getAsset(id);
        return createSuccessResponse(asset);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Asset ID is required for update operation');
        }
        const updatedAsset = await client.updateAsset(id, fields || {});
        return createSuccessResponse(updatedAsset, 'Asset updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Asset ID is required for delete operation');
        }
        await client.deleteAsset(id);
        return createSuccessResponse(null, 'Asset deleted successfully');
        
      case 'archive':
        if (!id) {
          return createErrorResponse('Asset ID is required for archive operation');
        }
        await client.archiveAsset(id);
        return createSuccessResponse(null, 'Asset archived successfully');
        
      case 'unarchive':
        if (!id) {
          return createErrorResponse('Asset ID is required for unarchive operation');
        }
        await client.unarchiveAsset(id);
        return createSuccessResponse(null, 'Asset unarchived successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Assets operation failed: ${error.message}`);
  }
}

export async function executeAssetsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const assets = await client.getAssets(args);
    return createSuccessResponse(assets);
  } catch (error: any) {
    return createErrorResponse(`Assets query failed: ${error.message}`);
  }
}