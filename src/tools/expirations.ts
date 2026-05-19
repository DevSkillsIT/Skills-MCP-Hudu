import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createQuerySchema, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Expirations query tool (read-only, no CRUD)
export const expirationsTool: Tool = {
  name: 'search_expiration_tracking',
  description: 'Expirações, vencimentos e validades de domínios, certificados SSL, garantias e licenças no Hudu — consulta com filtros de empresa e tipo. Use quando precisar monitorar datas de vencimento, renovações ou expirações de qualquer recurso no Hudu. Consulta somente leitura com paginação. Retorna lista formatada em Markdown.',
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
    const data = results || [];
    return createSuccessResponse(data, `Found ${data.length} expirations`);
  } catch (error: any) {
    return createErrorResponse(`Failed to search expirations: ${error.message}`);
  }
}
