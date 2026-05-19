import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, createDeleteActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Relations manage tool (CRUD)
export const relationsTool: Tool = {
  name: 'hudu_manage_entity_relations',
  description: 'Relacoes, vinculos e associacoes entre entidades no Hudu — operacoes create e delete (a API do Hudu NAO suporta GET nem PUT em relations). Use hudu_search_entity_relations para listar/filtrar. Aceita action (create, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(createDeleteActions, 'Ação a executar. Valores: create (criar nova relacao), delete (excluir por ID). A API do Hudu NAO suporta get ou update — use hudu_search_entity_relations para listar e filtrar.'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        description: { type: 'string', description: 'Descrição do vínculo entre as entidades' },
        fromable_type: { type: 'string', enum: ['Asset', 'Company', 'Article', 'Procedure', 'Website', 'Network', 'IpAddress', 'Vlan', 'VlanZone', 'AssetPassword'], description: 'Tipo da entidade de origem (obrigatório para criação). Valores: Asset, Company, Article, Procedure, Website, Network, IpAddress, Vlan, VlanZone, AssetPassword' },
        fromable_id: { type: 'number', description: 'ID da entidade de origem (obrigatório para criação)' },
        toable_type: { type: 'string', enum: ['Asset', 'Company', 'Article', 'Procedure', 'Website', 'Network', 'IpAddress', 'Vlan', 'VlanZone', 'AssetPassword'], description: 'Tipo da entidade de destino (obrigatório para criação)' },
        toable_id: { type: 'number', description: 'ID da entidade de destino (obrigatório para criação)' },
        is_inverse: { type: 'boolean', description: 'Se true, cria também a relação no sentido inverso automaticamente' }
      }, ['fromable_type', 'fromable_id', 'toable_type', 'toable_id'])
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
          return createErrorResponse('Para criar uma relation, fields deve conter: fromable_type, fromable_id, toable_type, toable_id.');
        }
        const newRelation = await client.createRelation(fields);
        return createSuccessResponse(newRelation, 'Relation created successfully');

      case 'get':
        return createErrorResponse(
          'A API do Hudu NAO suporta GET /relations/:id. ' +
          'Use hudu_search_entity_relations para listar e filtrar relations por fromable_type, fromable_id, toable_type ou toable_id.'
        );

      case 'update':
        return createErrorResponse(
          'A API do Hudu NAO suporta PUT /relations/:id. ' +
          'Para alterar uma relation, delete a existente (action=delete) e crie uma nova (action=create).'
        );

      case 'delete':
        if (!id) {
          return createErrorResponse('id e obrigatorio para action=delete.');
        }
        await client.deleteRelation(id);
        return createSuccessResponse(null, 'Relation deleted successfully');

      default:
        return createErrorResponse(`Acao desconhecida: '${action}'. Acoes validas: create, get, update, delete.`);
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
