import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

export const adminTool: Tool = {
  name: 'hudu_admin_instance_operations',
  description: 'Administração, auditoria e monitoramento da instância do Hudu — info da API, logs, exportações e expirações. Use quando precisar consultar versão, auditar atividades ou verificar itens expirados no Hudu. Aceita action (get_api_info, get_activity_logs, delete_activity_logs, get_exports, get_s3_exports, get_expirations). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_api_info', 'get_activity_logs', 'delete_activity_logs', 'get_exports', 'get_s3_exports', 'get_expirations'],
        description: 'Ação administrativa. Valores: get_api_info (informações da API e versão), get_activity_logs (consultar logs de atividade), delete_activity_logs (excluir logs anteriores a uma data), get_exports (listar exportações disponíveis), get_s3_exports (listar exportações armazenadas em S3), get_expirations (listar itens com data de expiração)'
      },
      user_id: { type: 'number', description: 'Filtrar por ID do usuário (usado com get_activity_logs)' },
      resource_type: { type: 'string', description: 'Filtrar por tipo de recurso (usado com get_activity_logs)' },
      start_date: { type: 'string', description: 'Data inicial para filtro de logs, formato ISO 8601 (AAAA-MM-DD). Usado com get_activity_logs' },
      datetime: { type: 'string', description: 'Excluir logs anteriores a esta data/hora, formato ISO 8601 (AAAA-MM-DDTHH:mm:ssZ). Usado com delete_activity_logs' },
      delete_unassigned_logs: { type: 'boolean', description: 'Se deve excluir também logs não atribuídos a usuários. Usado com delete_activity_logs' },
      company_id: { type: 'number', description: 'Filtrar por ID da empresa (usado com get_expirations)' },
      expiration_type: { type: 'string', description: 'Filtrar por tipo de expiração (usado com get_expirations)' },
      page: { type: 'number', minimum: 1, default: 1, description: 'Número da página para paginação' },
      page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Quantidade de resultados por página (máximo 100)' }
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution function
export async function executeAdminTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action } = args;
  
  try {
    switch (action) {
      case 'get_api_info':
        const apiInfo = await client.getApiInfo();
        return createSuccessResponse(apiInfo, 'API information retrieved successfully');
        
      case 'get_activity_logs':
        const filters = {
          user_id: args.user_id,
          resource_type: args.resource_type,
          start_date: args.start_date,
          page: args.page,
          page_size: args.page_size
        };
        const activityLogs = await client.getActivityLogs(filters);
        return createSuccessResponse(activityLogs, 'Activity logs retrieved successfully');
        
      case 'delete_activity_logs':
        if (!args.datetime) {
          return createErrorResponse('Datetime is required for delete_activity_logs operation');
        }
        await client.deleteActivityLogs(args.datetime, args.delete_unassigned_logs || false);
        return createSuccessResponse(null, 'Activity logs deleted successfully');
        
      case 'get_exports':
        const exportFilters = {
          page: args.page,
          page_size: args.page_size
        };
        const exports = await client.getExports(exportFilters);
        return createSuccessResponse(exports, 'Exports retrieved successfully');
        
      case 'get_s3_exports':
        const s3ExportFilters = {
          page: args.page,
          page_size: args.page_size
        };
        const s3Exports = await client.getS3Exports(s3ExportFilters);
        return createSuccessResponse(s3Exports, 'S3 exports retrieved successfully');
        
      case 'get_expirations':
        const expirationFilters = {
          company_id: args.company_id,
          expiration_type: args.expiration_type,
          page: args.page,
          page_size: args.page_size
        };
        const expirations = await client.getExpirations(expirationFilters);
        return createSuccessResponse(expirations, 'Expirations retrieved successfully');
        
      default:
        return createErrorResponse(`Unknown admin action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Admin operation failed: ${error.message}`);
  }
}