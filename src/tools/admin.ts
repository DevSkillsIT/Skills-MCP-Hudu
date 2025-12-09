import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PaginationSchema, createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

// Admin operations tool with various administrative functions
const AdminActionSchema = z.enum([
  'get_api_info',
  'get_activity_logs',
  'delete_activity_logs',
  'get_exports',
  'get_s3_exports',
  'get_expirations'
]);

export const adminTool: Tool = {
  name: 'admin',
  description: 'Administrative operations for Hudu instance management',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_api_info', 'get_activity_logs', 'delete_activity_logs', 'get_exports', 'get_s3_exports', 'get_expirations'],
        description: 'Administrative action to perform'
      },
      user_id: { type: 'number', description: 'Filter by user ID (for activity logs)' },
      resource_type: { type: 'string', description: 'Filter by resource type (for activity logs)' },
      start_date: { type: 'string', description: 'Filter by start date ISO format (for activity logs)' },
      datetime: { type: 'string', description: 'Delete logs before this ISO datetime' },
      delete_unassigned_logs: { type: 'boolean', description: 'Whether to delete unassigned logs' },
      company_id: { type: 'number', description: 'Filter by company ID (for expirations)' },
      expiration_type: { type: 'string', description: 'Filter by expiration type' },
      page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
      page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Results per page' }
    },
    required: ['action']
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