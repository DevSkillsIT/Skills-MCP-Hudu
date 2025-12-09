import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

// Navigation operations tool

export const navigationTool: Tool = {
  name: 'navigation',
  description: 'Navigation operations for jumping to specific Hudu locations',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['card_jump', 'card_lookup', 'company_jump'],
        description: 'Navigation action to perform'
      },
      name: { type: 'string', description: 'Name for searching/jumping' },
      company_id: { type: 'number', description: 'Company ID for filtering' }
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