import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createQuerySchema } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Activity logs query tool (read-only, no CRUD)
export const activityLogsTool: Tool = {
  name: 'hudu_search_activity_audit_logs',
  description: 'Logs de atividade, auditoria e historico de alteracoes no Hudu — consulta de acoes realizadas por usuarios com filtros avancados. Use quando precisar auditar alteracoes, rastrear quem modificou recursos ou investigar acoes recentes. Consulta somente leitura. Retorna lista paginada em Markdown.',
  inputSchema: createQuerySchema({
    user_id: { type: 'number', description: 'Filtrar por ID do usuário que realizou a ação' },
    user_email: { type: 'string', description: 'Filtrar por e-mail do usuário que realizou a ação' },
    resource_type: { type: 'string', description: 'Tipo de recurso afetado (ex: Asset, Company, Article)' },
    resource_id: { type: 'number', description: 'ID do recurso específico para filtrar ações' },
    action_message: { type: 'string', description: 'Filtrar pelo texto da mensagem de ação registrada' },
    start_date: { type: 'string', description: 'Data de início para filtrar logs (formato ISO 8601, ex: 2024-01-01T00:00:00Z)' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution function
export async function executeActivityLogsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const logs = await client.getActivityLogs(args);
    return createSuccessResponse(logs);
  } catch (error: any) {
    return createErrorResponse(`Activity logs query failed: ${error.message}`);
  }
}
