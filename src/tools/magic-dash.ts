import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, createDeleteActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Magic Dash manage tool (CRUD)
export const magicDashTool: Tool = {
  name: 'hudu_manage_dashboard_widgets',
  description: 'Widgets de dashboard, paineis e indicadores no Hudu — operacoes create e delete (a API do Hudu NAO suporta GET nem PUT em magic_dash individuais). Use hudu_search_dashboard_widgets para listar. Aceita action (create, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(createDeleteActions, 'Ação a executar. Valores: create (criar novo widget), delete (excluir por ID). A API do Hudu NAO suporta GET nem PUT em magic_dash individuais — use hudu_search_dashboard_widgets para listar.'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        title: { type: 'string', description: 'Título do widget no dashboard (obrigatório para criação)' },
        company_name: { type: 'string', description: 'Nome EXATO da empresa associada ao widget, ex: "Skills IT Palmas" (obrigatório para criação — é o nome, não o ID)' },
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
  description: 'Widgets de dashboard, paineis de controle e indicadores no Hudu — busca e filtragem de itens do Magic Dash por nome ou empresa. Use quando precisar listar ou localizar widgets e cards de status existentes no Hudu sem saber o ID exato. Consulta somente leitura. Retorna lista paginada em Markdown.',
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
        return createErrorResponse(
          'A API do Hudu NAO suporta GET /magic_dash/:id. ' +
          'Use hudu_search_dashboard_widgets para listar widgets disponiveis.'
        );

      case 'update':
        return createErrorResponse(
          'A API do Hudu NAO suporta PUT /magic_dash/:id. ' +
          'Para atualizar, delete o widget existente e crie um novo.'
        );

      case 'delete':
        if (!id) {
          return createErrorResponse('Magic dash ID is required for delete operation');
        }
        await client.deleteMagicDash(id);
        return createSuccessResponse(null, 'Magic dash item deleted successfully');

      default:
        return createErrorResponse(`Acao desconhecida: '${action}'. Acoes validas: create, get, update, delete.`);
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
