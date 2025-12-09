import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const companiesTool: Tool = {
  name: 'companies',
  description: 'Create and manage Hudu companies',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Company name' },
        nickname: { type: 'string', description: 'Company nickname' },
        company_type: { type: 'string', description: 'Company type' },
        website: { type: 'string', description: 'Company website URL' },
        phone_number: { type: 'string', description: 'Phone number' },
        address_line_1: { type: 'string', description: 'Address line 1' },
        city: { type: 'string', description: 'City' },
        state: { type: 'string', description: 'State' },
        zip: { type: 'string', description: 'ZIP code' }
      })
    },
    required: ['action']
  }
};

// Companies query tool
export const companiesQueryTool: Tool = {
  name: 'companies.query',
  description: 'Search and filter Hudu companies with pagination',
  inputSchema: createQuerySchema({})
};

// Tool execution functions
export async function executeCompaniesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Company name is required for creating companies');
        }
        const newCompany = await client.createCompany(fields);
        return createSuccessResponse(newCompany, 'Company created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Company ID is required for get operation');
        }
        const company = await client.getCompany(id);
        return createSuccessResponse(company);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Company ID is required for update operation');
        }
        const updatedCompany = await client.updateCompany(id, fields || {});
        return createSuccessResponse(updatedCompany, 'Company updated successfully');
        
      case 'archive':
        if (!id) {
          return createErrorResponse('Company ID is required for archive operation');
        }
        await client.archiveCompany(id);
        return createSuccessResponse(null, 'Company archived successfully');
        
      case 'unarchive':
        if (!id) {
          return createErrorResponse('Company ID is required for unarchive operation');
        }
        await client.unarchiveCompany(id);
        return createSuccessResponse(null, 'Company unarchived successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Companies operation failed: ${error.message}`);
  }
}

export async function executeCompaniesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const companies = await client.getCompanies(args);
    return createSuccessResponse(companies);
  } catch (error: any) {
    return createErrorResponse(`Companies query failed: ${error.message}`);
  }
}