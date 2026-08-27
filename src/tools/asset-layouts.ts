import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  createErrorResponse,
  createSuccessResponse,
  createWarnedResponse,
  type ToolResponse
} from './base.js';
import {
  createActionSchema,
  createFieldsSchema,
  idForActions
} from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Asset layouts manage tool (CRUD without delete)
export const assetLayoutsTool: Tool = {
  name: 'hudu_manage_asset_layout_templates',
  description: 'Layouts, templates e modelos de ativos no Hudu — criação, consulta e atualização de estruturas de campos personalizados, tipos de equipamento e categorias. Use quando precisar definir ou modificar o modelo de campos de um tipo de ativo no Hudu. Aceita action (create, get, update). Retorna Markdown com dados do layout processado.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(['create', 'get', 'update'], 'Ação a executar. Valores: create (criar novo layout), get (obter por ID), update (atualizar por ID). Delete não é suportado para layouts de ativos.'),
      id: idForActions(['create', 'get', 'update']),
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do layout de ativo (obrigatório para criação)' },
        icon: { type: 'string', description: 'Classe de icone Font Awesome para o layout, ex: fa-server' },
        color: { type: 'string', description: 'Cor de fundo do icone no formato hexadecimal, ex: #000000' },
        icon_color: { type: 'string', description: 'Cor do icone no formato hexadecimal, ex: #ffffff' },
        include_passwords: { type: 'boolean', description: 'Incluir aba de senhas nos ativos deste layout' },
        include_photos: { type: 'boolean', description: 'Incluir aba de fotos nos ativos deste layout' },
        include_comments: { type: 'boolean', description: 'Incluir aba de comentarios nos ativos deste layout' },
        include_files: { type: 'boolean', description: 'Incluir aba de arquivos nos ativos deste layout' },
        active: { type: 'boolean', description: 'Se o layout está ativo e disponível para uso' },
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
// Hudu API /asset_layouts silently caps page size at 25 (REQ-14 / PRB-03).
// The page_size parameter below is advertised so callers can express intent,
// but the upstream API does NOT honor it — we surface the cap by emitting a
// `page_size_capped: 25` metadata note in the executor when results saturate.
const ASSET_LAYOUTS_PAGE_SIZE_CAP = 25;

export const assetLayoutsQueryTool: Tool = {
  name: 'hudu_search_asset_layout_templates',
  description: 'Layouts, templates e modelos de ativos no Hudu — busca e filtragem de estruturas de campos personalizados, tipos de equipamento e categorias por nome. Use quando precisar listar layouts do Hudu sem saber o ID exato. Consulta somente leitura. Nota da API 2.41.2: /asset_layouts limita cada página a 25 itens e sinaliza com page_size_capped. Retorna lista paginada em Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Texto de busca para filtrar resultados' },
      name: { type: 'string', description: 'Filtrar por nome exato ou parcial' },
      slug: { type: 'string', description: 'Filtrar por slug do layout' },
      updated_at: { type: 'string', description: 'Filtrar por data de atualização (formato ISO 8601 AAAA-MM-DD)' },
      page: { type: 'number', minimum: 1, default: 1, description: 'Número da página para paginação' },
      page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Solicitação de tamanho de página. A API do Hudu ignora este valor e aplica o limite fixo de 25 itens; o campo é exposto apenas por consistência com outras tools.' }
    }
  },
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
    // REQ-14 / PRB-03: /asset_layouts ceilings each page at 25 whatever
    // page_size says, so a saturated page probably hides records.
    //
    // BUG-17: that signal used to be sent by returning
    // `{records, page_size_capped}` instead of the array. The formatter calls
    // `.map()` on what it receives, so every call on an instance with 25+
    // layouts died with "paged.records.map is not a function" — the tool was
    // dead here, including with no arguments at all. The caveat travels in
    // `warning` now, which reaches the caller without changing the shape.
    const capped =
      Array.isArray(layouts) && layouts.length >= ASSET_LAYOUTS_PAGE_SIZE_CAP;
    return createWarnedResponse(
      layouts,
      capped
        ? `A API do Hudu limita /asset_layouts a ${ASSET_LAYOUTS_PAGE_SIZE_CAP} itens por página, independente de page_size. Vieram ${ASSET_LAYOUTS_PAGE_SIZE_CAP}, então pode haver mais — peça a próxima página para confirmar.`
        : null
    );
  } catch (error: any) {
    return createErrorResponse(`Asset layouts query failed: ${error.message}`);
  }
}
