import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createQuerySchema, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Expirations query tool (read-only, no CRUD)
export const expirationsTool: Tool = {
  name: 'hudu_search_expiration_tracking',
  description: 'Expiracoes, vencimentos e validades de dominios, certificados SSL, garantias e licencas no Hudu — consulta com filtros de empresa e tipo. Use quando precisar monitorar datas de vencimento, renovacoes ou expiracoes de qualquer recurso no Hudu. Consulta somente leitura com paginacao. Retorna lista formatada em Markdown.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id,
    item_type: { type: 'string', description: 'Tipo do item (Domain, SSL Certificate, Warranty, License, etc.)' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

export async function executeExpirationsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const { company_id, item_type, page } = args;
    const results = await client.getExpirations({
      company_id,
      item_type,
      page: page || 1
    });
    return createSuccessResponse(results, `Found ${results.length} expirations`);
  } catch (error: any) {
    return createErrorResponse(`Failed to search expirations: ${error.message}`);
  }
}
