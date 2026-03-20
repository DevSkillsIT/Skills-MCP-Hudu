import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Magic Dash manage tool (CRUD)
export const magicDashTool: Tool = {
  name: 'hudu_manage_dashboard_widgets',
  description: 'Widgets de dashboard, paineis de controle e indicadores no Hudu — operacoes CRUD para gerenciar itens do Magic Dash. Use quando precisar criar paineis customizados, cards de status ou indicadores para empresas no Hudu. Aceita action (create, get, update, delete). Retorna Markdown com dados do widget processado.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo widget), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        title: { type: 'string', description: 'Título do widget no dashboard (obrigatório para criação)' },
        company_name: { type: 'string', description: 'Nome exato da empresa associada ao widget (obrigatório para criação)' },
        content_link: { type: 'string', description: 'URL de link para o conteúdo relacionado ao widget' },
        content: { type: 'string', description: 'Conteúdo textual exibido no widget do dashboard' },
        icon: { type: 'string', description: 'Ícone a ser exibido no widget (ex: nome de ícone FontAwesome)' },
        shade: { type: 'string', description: 'Cor ou tonalidade do widget (ex: success, warning, danger, info)' },
        message: { type: 'string', description: 'Mensagem de status ou informação adicional exibida no widget' }
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
