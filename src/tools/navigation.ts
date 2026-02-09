import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

// Navigation operations tool

export const navigationTool: Tool = {
  name: 'hudu_navigate_to_resource_by_name',
  description: 'Navegação rápida e acesso direto a recursos e registros no Hudu — saltar para fichas, consultar registros e acessar empresas por nome. Use quando precisar acessar diretamente um recurso específico pelo nome no Hudu. Aceita action (card_jump, card_lookup, company_jump). Retorna JSON com dados do recurso localizado.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['card_jump', 'card_lookup', 'company_jump'],
        description: 'Ação de navegação. Valores: card_jump (saltar diretamente para um registro/ficha pelo nome, retorna URL do recurso), card_lookup (buscar registros/fichas correspondentes ao nome informado), company_jump (saltar para página da empresa pelo nome)'
      },
      name: { type: 'string', description: 'Nome do recurso ou empresa para busca ou navegação direta' },
      company_id: { type: 'number', description: 'ID da empresa para filtrar resultados' }
    },
    required: ['action']
  }
};

// Tool execution function
export async function executeNavigationTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, name, company_id } = args;
  
  try {
    switch (action) {
      case 'card_jump':
        if (!name) {
          return createErrorResponse('Name is required for card_jump operation');
        }
        const jumpParams = { name, company_id };
        const jumpResult = await client.cardJump(jumpParams);
        return createSuccessResponse(jumpResult, `Jumped to card "${name}" successfully`);
        
      case 'card_lookup':
        if (!name) {
          return createErrorResponse('Name is required for card_lookup operation');
        }
        const lookupParams = { name, company_id };
        const lookupResult = await client.cardLookup(lookupParams);
        return createSuccessResponse(lookupResult, 'Card lookup completed successfully');
        
      case 'company_jump':
        if (!name) {
          return createErrorResponse('Name is required for company_jump operation');
        }
        const companyJumpResult = await client.companyJump({ name });
        return createSuccessResponse(companyJumpResult, `Jumped to company "${name}" successfully`);
        
      default:
        return createErrorResponse(`Unknown navigation action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Navigation operation failed: ${error.message}`);
  }
}