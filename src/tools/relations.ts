import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Relations manage tool (CRUD)
export const relationsTool: Tool = {
  name: 'hudu_manage_entity_relations',
  description: 'Relacoes, vinculos e associacoes entre entidades no Hudu — operacoes CRUD para gerenciar relacionamentos entre recursos. Use quando precisar criar, consultar, atualizar ou excluir vinculos entre ativos, empresas, artigos ou outros objetos no Hudu. Aceita action (create, get, update, delete). Retorna Markdown com dados da relacao processada.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar nova relação), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome ou descrição da relação' },
        description: { type: 'string', description: 'Descrição detalhada do vínculo entre as entidades' },
        fromable_type: { type: 'string', description: 'Tipo da entidade de origem (obrigatório para criação, ex: Asset, Company, Article)' },
        fromable_id: { type: 'number', description: 'ID da entidade de origem (obrigatório para criação)' },
        toable_type: { type: 'string', description: 'Tipo da entidade de destino (obrigatório para criação, ex: Asset, Company, Article)' },
        toable_id: { type: 'number', description: 'ID da entidade de destino (obrigatório para criação)' }
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

// Relations query tool
export const relationsQueryTool: Tool = {
  name: 'hudu_search_entity_relations',
  description: 'Relações, vínculos e associações entre entidades no Hudu — busca e filtragem de relacionamentos por tipo e ID de origem ou destino. Use quando precisar listar todos os vínculos de um recurso específico ou encontrar conexões entre entidades. Consulta somente leitura. Retorna lista paginada em Markdown.',
  inputSchema: createQuerySchema({
    fromable_type: { type: 'string', description: 'Filtrar por tipo da entidade de origem (ex: Asset, Company, Article)' },
    fromable_id: { type: 'number', description: 'Filtrar por ID da entidade de origem' },
    toable_type: { type: 'string', description: 'Filtrar por tipo da entidade de destino (ex: Asset, Company, Article)' },
    toable_id: { type: 'number', description: 'Filtrar por ID da entidade de destino' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution functions
export async function executeRelationsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;

  try {
    switch (action) {
      case 'create':
        if (!fields?.fromable_type || !fields?.fromable_id || !fields?.toable_type || !fields?.toable_id) {
          return createErrorResponse('fromable_type, fromable_id, toable_type and toable_id are required for creating relations');
        }
        const newRelation = await client.createRelation(fields);
        return createSuccessResponse(newRelation, 'Relation created successfully');

      case 'get':
        if (!id) {
          return createErrorResponse('Relation ID is required for get operation');
        }
        const relation = await client.getRelation(id);
        return createSuccessResponse(relation);

      case 'update':
        if (!id) {
          return createErrorResponse('Relation ID is required for update operation');
        }
        const updatedRelation = await client.updateRelation(id, fields || {});
        return createSuccessResponse(updatedRelation, 'Relation updated successfully');

      case 'delete':
        if (!id) {
          return createErrorResponse('Relation ID is required for delete operation');
        }
        await client.deleteRelation(id);
        return createSuccessResponse(null, 'Relation deleted successfully');

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Relations operation failed: ${error.message}`);
  }
}

export async function executeRelationsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const relations = await client.getRelations(args);
    return createSuccessResponse(relations);
  } catch (error: any) {
    return createErrorResponse(`Relations query failed: ${error.message}`);
  }
}
