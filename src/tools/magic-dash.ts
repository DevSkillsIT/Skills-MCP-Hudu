import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, commonProperties,
  idForActions
} from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Magic Dash manage tool
// REQ-17 / PRB-06 + REQ-16 / PRB-05: Hudu API 2.41.2 only exposes POST
// /magic_dash (create) and DELETE /magic_dash/{id} (delete) for dashboard
// widgets. There is no GET-by-ID or PATCH endpoint, so only create and
// delete are advertised here. Listing remains available via the query tool.
export const magicDashTool: Tool = {
  name: 'hudu_manage_dashboard_widgets',
  description: 'Widgets de dashboard, painéis de controle e indicadores no Hudu (Magic Dash) — operações: criar e excluir. A API do Hudu 2.41.2 não expõe GET por ID nem PATCH para widgets; para listar os existentes use search_dashboard_widgets. Use create para painéis customizados, cards de status ou indicadores por empresa; use delete para remover. Retorna Markdown do widget.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(['create', 'delete'], 'Ação a executar. Valores: create (criar novo widget), delete (excluir por ID). A API do Hudu 2.41.2 não suporta get-by-id ou update para widgets de dashboard.'),
      id: idForActions(['create', 'delete']),
      fields: createFieldsSchema({
        title: { type: 'string', description: 'Título do widget no dashboard (obrigatório para criação)' },
        company_name: { type: 'string', description: 'Nome EXATO da empresa associada ao widget, ex: "Empresa Exemplo Ltda" (obrigatório para criação — é o nome, não o ID)' },
        content_link: { type: 'string', description: 'URL de link para o conteúdo relacionado ao widget' },
        content: { type: 'string', description: 'Conteúdo textual (HTML/Markdown) exibido no widget' },
        icon: { type: 'string', description: 'Classe FontAwesome do ícone (ex: fa-server)' },
        image_url: { type: 'string', description: 'URL de imagem a exibir no widget (alternativa ao icon)' },
        shade: { type: 'string', enum: ['success', 'warning', 'danger', 'info', 'primary', 'secondary'], description: 'Cor/tonalidade do widget. Valores: success, warning, danger, info, primary, secondary' },
        message: { type: 'string', description: 'Mensagem de status exibida no widget' }
      }, ['title', 'company_name'])
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// Magic Dash query tool
export const magicDashQueryTool: Tool = {
  name: 'hudu_search_dashboard_widgets',
  description: 'Widgets de dashboard, painéis de controle e indicadores no Hudu — busca e filtragem de itens do Magic Dash por nome ou empresa. Use quando precisar listar ou localizar widgets e cards de status existentes no Hudu sem saber o ID exato. Consulta somente leitura. Retorna lista paginada em Markdown.',
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
export async function executeMagicDashTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;

  try {
    switch (action) {
      case 'create':
        if (!fields?.title || !fields?.company_name) {
          return createErrorResponse('title and company_name are required for creating magic dash items');
        }
        const newMagicDash = await client.createMagicDash(fields);
        return createSuccessResponse(newMagicDash, 'Magic dash item created successfully');

      case 'get':
        if (!id) {
          return createErrorResponse('Magic dash ID is required for get operation');
        }
        const magicDash = await client.getMagicDash(id);
        return createSuccessResponse(magicDash);

      case 'update':
        if (!id) {
          return createErrorResponse('Magic dash ID is required for update operation');
        }
        const updatedMagicDash = await client.updateMagicDash(id, fields || {});
        return createSuccessResponse(updatedMagicDash, 'Magic dash item updated successfully');

      case 'delete':
        if (!id) {
          return createErrorResponse('Magic dash ID is required for delete operation');
        }
        await client.deleteMagicDash(id);
        return createSuccessResponse(null, 'Magic dash item deleted successfully');

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Magic dash operation failed: ${error.message}`);
  }
}

export async function executeMagicDashQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const magicDashes = await client.getMagicDashes(args);
    return createSuccessResponse(magicDashes);
  } catch (error: any) {
    return createErrorResponse(`Magic dash query failed: ${error.message}`);
  }
}
