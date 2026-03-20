import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Asset layouts manage tool (CRUD without delete)
export const assetLayoutsTool: Tool = {
  name: 'hudu_manage_asset_layout_templates',
  description: 'Layouts, templates e modelos de ativos no Hudu — criacao, consulta e atualizacao de estruturas de campos personalizados, tipos de equipamento e categorias. Use quando precisar definir ou modificar o modelo de campos de um tipo de ativo no Hudu. Aceita action (create, get, update). Retorna Markdown com dados do layout processado.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(['create', 'get', 'update'], 'Acao a executar. Valores: create (criar novo layout), get (obter por ID), update (atualizar por ID). Delete nao e suportado para layouts de ativos.'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do layout de ativo (obrigatorio para criacao)' },
        icon: { type: 'string', description: 'Classe de icone Font Awesome para o layout, ex: fa-server' },
        color: { type: 'string', description: 'Cor de fundo do icone no formato hexadecimal, ex: #000000' },
        icon_color: { type: 'string', description: 'Cor do icone no formato hexadecimal, ex: #ffffff' },
        include_passwords: { type: 'boolean', description: 'Incluir aba de senhas nos ativos deste layout' },
        include_photos: { type: 'boolean', description: 'Incluir aba de fotos nos ativos deste layout' },
        include_comments: { type: 'boolean', description: 'Incluir aba de comentarios nos ativos deste layout' },
        include_files: { type: 'boolean', description: 'Incluir aba de arquivos nos ativos deste layout' },
        active: { type: 'boolean', description: 'Se o layout esta ativo e disponivel para uso' },
        fields: {
          type: 'array',
          description: 'Lista de campos personalizados do layout',
          items: {
            type: 'object',
            description: 'Definicao de um campo personalizado do layout de ativo'
          }
        }
      })
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Asset layouts query tool
export const assetLayoutsQueryTool: Tool = {
  name: 'hudu_search_asset_layout_templates',
  description: 'Layouts, templates e modelos de ativos no Hudu — busca e filtragem de estruturas de campos personalizados, tipos de equipamento e categorias por nome. Use quando precisar listar ou localizar layouts disponiveis no Hudu sem saber o ID exato. Consulta somente leitura. Retorna lista paginada em Markdown com dados resumidos dos layouts encontrados.',
  inputSchema: createQuerySchema({}),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution functions
export async function executeAssetLayoutsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;

  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Asset layout name is required for creating asset layouts');
        }
        const newLayout = await client.createAssetLayout(fields);
        return createSuccessResponse(newLayout, 'Asset layout created successfully');

      case 'get':
        if (!id) {
          return createErrorResponse('Asset layout ID is required for get operation');
        }
        const layout = await client.getAssetLayout(id);
        return createSuccessResponse(layout);

      case 'update':
        if (!id) {
          return createErrorResponse('Asset layout ID is required for update operation');
        }
        const updatedLayout = await client.updateAssetLayout(id, fields || {});
        return createSuccessResponse(updatedLayout, 'Asset layout updated successfully');

      case 'delete':
        return createErrorResponse('Delete is not supported for asset layouts');

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Asset layouts operation failed: ${error.message}`);
  }
}

export async function executeAssetLayoutsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const layouts = await client.getAssetLayouts(args);
    return createSuccessResponse(layouts);
  } catch (error: any) {
    return createErrorResponse(`Asset layouts query failed: ${error.message}`);
  }
}
