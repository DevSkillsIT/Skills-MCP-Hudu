import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

/**
 * Filtra parâmetros de query para remover os não suportados pela API do Hudu.
 * A API de networks/vlans/etc não aceita page_size, search e outros.
 */
function filterNetworkQueryParams(args: any): any {
  const { name, company_id, network_id, address } = args;
  const filtered: any = {};
  if (name) filtered.name = name;
  if (company_id) filtered.company_id = company_id;
  if (network_id) filtered.network_id = network_id;
  if (address) filtered.address = address;
  
  return filtered;
}



// Networks resource tool
export const networksTool: Tool = {
  name: 'hudu_manage_network_documentation',
  description: 'Redes, sub-redes e segmentos de infraestrutura documentados no Hudu — operações CRUD para registros de rede. Use quando precisar cadastrar, editar ou excluir redes e seus ranges de IP no Hudu. Requer name, network_type, network e mask. Aceita action (create, get, update, delete). Retorna Markdown da rede.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da rede (obrigatório para criação)' },
        network_type: { type: 'string', description: 'Tipo da rede (obrigatório para criação)' },
        network: { type: 'string', description: 'Endereço de rede, ex: 192.168.1.0 (obrigatório para criação)' },
        mask: { type: 'string', description: 'Máscara de rede, ex: 255.255.255.0 (obrigatório para criação)' },
        gateway: { type: 'string', description: 'Endereço do gateway padrão da rede' },
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// Networks query tool
export const networksQueryTool: Tool = {
  name: 'hudu_search_network_documentation',
  description: 'Redes, sub-redes e segmentos de infraestrutura documentados no Hudu — busca e filtragem com paginação. Use quando precisar localizar redes ou ranges de IP por empresa no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados das redes encontradas no inventário de infraestrutura.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// VLANs resource tool
export const vlansTool: Tool = {
  name: 'hudu_manage_network_vlan_records',
  description: 'VLANs, segmentos virtuais e redes lógicas documentadas no Hudu — operações CRUD para registros de VLAN. Use quando precisar cadastrar, editar ou excluir VLANs associadas a redes no Hudu. Requer name e vid (VLAN ID numérico). Aceita action (create, get, update, delete). Retorna Markdown da VLAN.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da VLAN (obrigatório para criação)' },
        vid: { type: 'number', description: 'Número identificador da VLAN (obrigatório para criação)' },
        network_id: { type: 'number', description: 'ID da rede associada à VLAN' }
      })
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// VLANs query tool
export const vlansQueryTool: Tool = {
  name: 'hudu_search_network_vlan_records',
  description: 'VLANs, segmentos virtuais e redes lógicas documentadas no Hudu — busca e filtragem com paginação. Use quando precisar localizar VLANs de uma rede específica por network_id no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados das VLANs encontradas.',
  inputSchema: createQuerySchema({
    network_id: { type: 'number', description: 'Filtrar por ID da rede' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// VLAN Zones resource tool
export const vlanZonesTool: Tool = {
  name: 'hudu_manage_network_vlan_zones',
  description: 'Zonas de VLAN, perímetros e agrupamentos lógicos de segmentação no Hudu — operações CRUD completas. Use quando precisar criar, editar ou excluir zonas para organizar VLANs no Hudu. Aceita action (create, get, update, delete) e campos como nome. Retorna Markdown da zona de VLAN processada.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da zona de VLAN (obrigatório para criação)' },
        description: commonProperties.description,
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// VLAN Zones query tool
export const vlanZonesQueryTool: Tool = {
  name: 'hudu_search_network_vlan_zones',
  description: 'Zonas de VLAN, perímetros e agrupamentos lógicos de segmentação no Hudu — busca e filtragem com paginação. Use quando precisar localizar zonas de organização de VLANs por empresa no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados das zonas encontradas.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// IP Addresses resource tool
export const ipAddressesTool: Tool = {
  name: 'hudu_manage_ip_address_records',
  description: 'Endereços IP, atribuições e reservas de rede documentados no Hudu — operações CRUD para registros de IP. Use quando precisar cadastrar, editar ou excluir IPs associados a redes no Hudu. Requer campo address para criação. Aceita action (create, get, update, delete). Retorna Markdown do endereço IP.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        address: { type: 'string', description: 'Endereço IP, ex: 192.168.1.10 (obrigatório para criação)' },
        hostname: { type: 'string', description: 'Nome do host associado ao endereço IP' },
        network_id: { type: 'number', description: 'ID da rede à qual o IP pertence' }
      })
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// IP Addresses query tool
export const ipAddressesQueryTool: Tool = {
  name: 'hudu_search_ip_address_records',
  description: 'Endereços IP, atribuições e reservas de rede documentados no Hudu — busca e filtragem com paginação. Use quando precisar localizar IPs por endereço ou rede específica no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados dos endereços IP encontrados no inventário.',
  inputSchema: createQuerySchema({
    address: { type: 'string', description: 'Filtrar por endereço IP exato ou parcial' },
    network_id: { type: 'number', description: 'Filtrar por ID da rede' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
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