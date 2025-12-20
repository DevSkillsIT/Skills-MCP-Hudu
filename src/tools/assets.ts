import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, standardActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

export const assetsTool: Tool = {
  name: 'assets',
  description: 'Create and manage Hudu IT assets',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(standardActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Asset name' },
        asset_type: { type: 'string', description: 'Asset type' },
        company_id: { ...commonProperties.company_id, description: 'Company ID (required for create)' },
        asset_layout_id: { type: 'number', description: 'Asset layout ID (required for create)' },
        fields: { type: 'array', items: {}, description: 'Asset field values based on layout' }
      })
    },
    required: ['action']
  }
};

// Assets query tool
export const assetsQueryTool: Tool = {
  name: 'assets_query',
  description: 'Search and filter Hudu assets with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id,
    asset_layout_id: { type: 'number', description: 'Filter by asset layout ID' },
    archived: { type: 'boolean', description: 'Include archived assets' }
  })
};

// Tool execution functions
export async function executeAssetsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.company_id || !fields?.asset_layout_id) {
          return createErrorResponse('Name, company_id, and asset_layout_id are required for creating assets');
        }
        const newAsset = await client.createAsset(fields);
        return createSuccessResponse(newAsset, 'Asset created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Asset ID is required for get operation');
        }
        const asset = await client.getAsset(id);
        return createSuccessResponse(asset);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Asset ID is required for update operation');
        }
        const updatedAsset = await client.updateAsset(id, fields || {});
        return createSuccessResponse(updatedAsset, 'Asset updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Asset ID is required for delete operation');
        }
        await client.deleteAsset(id);
        return createSuccessResponse(null, 'Asset deleted successfully');
        
      case 'archive':
        if (!id) {
          return createErrorResponse('Asset ID is required for archive operation');
        }
        await client.archiveAsset(id);
        return createSuccessResponse(null, 'Asset archived successfully');
        
      case 'unarchive':
        if (!id) {
          return createErrorResponse('Asset ID is required for unarchive operation');
        }
        await client.unarchiveAsset(id);
        return createSuccessResponse(null, 'Asset unarchived successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Assets operation failed: ${error.message}`);
  }
}

export async function executeAssetsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const assets = await client.getAssets(args);
    return createSuccessResponse(assets);
  } catch (error: any) {
    return createErrorResponse(`Assets query failed: ${error.message}`);
  }
}