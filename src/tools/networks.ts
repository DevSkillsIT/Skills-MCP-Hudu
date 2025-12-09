import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

/**
 * Filtra parâmetros de query para remover os não suportados pela API do Hudu.
 * A API de networks/vlans/etc não aceita page_size, search e outros.
 */
function filterNetworkQueryParams(args: any): any {
  const { name, company_id, network_id, address, page } = args;
  const filtered: any = {};
  if (name) filtered.name = name;
  if (company_id) filtered.company_id = company_id;
  if (network_id) filtered.network_id = network_id;
  if (address) filtered.address = address;
  
  return filtered;
}



// Networks resource tool
export const networksTool: Tool = {
  name: 'networks',
  description: 'Create and manage Hudu network documentation',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Network name' },
        network_type: { type: 'string', description: 'Network type (required for create)' },
        network: { type: 'string', description: 'Network address (required for create)' },
        mask: { type: 'string', description: 'Network mask (required for create)' },
        gateway: { type: 'string', description: 'Gateway address' },
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  }
};

// Networks query tool
export const networksQueryTool: Tool = {
  name: 'networks.query',
  description: 'Search and filter Hudu networks with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  })
};

// VLANs resource tool
export const vlansTool: Tool = {
  name: 'vlans',
  description: 'Create and manage VLANs within networks',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'VLAN name' },
        vid: { type: 'number', description: 'VLAN ID number (required for create)' },
        network_id: { type: 'number', description: 'Network ID' }
      })
    },
    required: ['action']
  }
};

// VLANs query tool
export const vlansQueryTool: Tool = {
  name: 'vlans.query',
  description: 'Search and filter VLANs with pagination',
  inputSchema: createQuerySchema({
    network_id: { type: 'number', description: 'Filter by network ID' }
  })
};

// VLAN Zones resource tool
export const vlanZonesTool: Tool = {
  name: 'vlan_zones',
  description: 'Create and manage VLAN zones',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Zone name' },
        description: commonProperties.description,
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  }
};

// VLAN Zones query tool
export const vlanZonesQueryTool: Tool = {
  name: 'vlan_zones.query',
  description: 'Search and filter VLAN zones with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  })
};

// IP Addresses resource tool
export const ipAddressesTool: Tool = {
  name: 'ip_addresses',
  description: 'Create and manage IP address assignments',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        address: { type: 'string', description: 'IP address (required for create)' },
        hostname: { type: 'string', description: 'Hostname' },
        network_id: { type: 'number', description: 'Network ID' }
      })
    },
    required: ['action']
  }
};

// IP Addresses query tool
export const ipAddressesQueryTool: Tool = {
  name: 'ip_addresses.query',
  description: 'Search and filter IP addresses with pagination',
  inputSchema: createQuerySchema({
    address: { type: 'string', description: 'Filter by IP address' },
    network_id: { type: 'number', description: 'Filter by network ID' }
  })
};

// Tool execution functions
export async function executeNetworksTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.network_type || !fields?.network || !fields?.mask) {
          return createErrorResponse('Name, network_type, network, and mask are required for creating networks');
        }
        const newNetwork = await client.createNetwork(fields);
        return createSuccessResponse(newNetwork, 'Network created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Network ID is required for get operation');
        }
        const network = await client.getNetwork(id);
        return createSuccessResponse(network);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Network ID is required for update operation');
        }
        const updatedNetwork = await client.updateNetwork(id, fields || {});
        return createSuccessResponse(updatedNetwork, 'Network updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Network ID is required for delete operation');
        }
        await client.deleteNetwork(id);
        return createSuccessResponse(null, 'Network deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Networks operation failed: ${error.message}`);
  }
}

export async function executeNetworksQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const networks = await client.getNetworks(filterNetworkQueryParams(args));
    return createSuccessResponse(networks);
  } catch (error: any) {
    return createErrorResponse(`Networks query failed: ${error.message}`);
  }
}

export async function executeVlansTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.vid) {
          return createErrorResponse('Name and VID are required for creating VLANs');
        }
        const newVlan = await client.createVlan(fields);
        return createSuccessResponse(newVlan, 'VLAN created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('VLAN ID is required for get operation');
        }
        const vlan = await client.getVlan(id);
        return createSuccessResponse(vlan);
        
      case 'update':
        if (!id) {
          return createErrorResponse('VLAN ID is required for update operation');
        }
        const updatedVlan = await client.updateVlan(id, fields || {});
        return createSuccessResponse(updatedVlan, 'VLAN updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('VLAN ID is required for delete operation');
        }
        await client.deleteVlan(id);
        return createSuccessResponse(null, 'VLAN deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`VLANs operation failed: ${error.message}`);
  }
}

export async function executeVlansQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const vlans = await client.getVlans(filterNetworkQueryParams(args));
    return createSuccessResponse(vlans);
  } catch (error: any) {
    return createErrorResponse(`VLANs query failed: ${error.message}`);
  }
}

export async function executeVlanZonesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Name is required for creating VLAN zones');
        }
        const newZone = await client.createVlanZone(fields);
        return createSuccessResponse(newZone, 'VLAN zone created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('VLAN zone ID is required for get operation');
        }
        const zone = await client.getVlanZone(id);
        return createSuccessResponse(zone);
        
      case 'update':
        if (!id) {
          return createErrorResponse('VLAN zone ID is required for update operation');
        }
        const updatedZone = await client.updateVlanZone(id, fields || {});
        return createSuccessResponse(updatedZone, 'VLAN zone updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('VLAN zone ID is required for delete operation');
        }
        await client.deleteVlanZone(id);
        return createSuccessResponse(null, 'VLAN zone deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`VLAN zones operation failed: ${error.message}`);
  }
}

export async function executeVlanZonesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const zones = await client.getVlanZones(filterNetworkQueryParams(args));
    return createSuccessResponse(zones);
  } catch (error: any) {
    return createErrorResponse(`VLAN zones query failed: ${error.message}`);
  }
}

export async function executeIpAddressesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.address) {
          return createErrorResponse('Address is required for creating IP addresses');
        }
        const newIpAddress = await client.createIpAddress(fields);
        return createSuccessResponse(newIpAddress, 'IP address created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('IP address ID is required for get operation');
        }
        const ipAddress = await client.getIpAddress(id);
        return createSuccessResponse(ipAddress);
        
      case 'update':
        if (!id) {
          return createErrorResponse('IP address ID is required for update operation');
        }
        const updatedIpAddress = await client.updateIpAddress(id, fields || {});
        return createSuccessResponse(updatedIpAddress, 'IP address updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('IP address ID is required for delete operation');
        }
        await client.deleteIpAddress(id);
        return createSuccessResponse(null, 'IP address deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`IP addresses operation failed: ${error.message}`);
  }
}

export async function executeIpAddressesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const ipAddresses = await client.getIpAddresses(filterNetworkQueryParams(args));
    return createSuccessResponse(ipAddresses);
  } catch (error: any) {
    return createErrorResponse(`IP addresses query failed: ${error.message}`);
  }
}