import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Uploads resource tool
export const uploadsTool: Tool = {
  name: 'hudu_manage_file_upload_records',
  description: 'Uploads, anexos e arquivos vinculados a recursos no Hudu — operações CRUD para registros de arquivos. Use quando precisar anexar, editar ou excluir documentos e arquivos associados a ativos ou empresas no Hudu. Requer name e filename. Aceita action (create, get, update, delete). Retorna Markdown do upload.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do upload (obrigatório para criação)' },
        filename: { type: 'string', description: 'Nome do arquivo com extensão (obrigatório para criação)' },
        content_type: { type: 'string', description: 'Tipo MIME do arquivo, ex: application/pdf' },
        uploadable_type: { type: 'string', description: 'Tipo do recurso pai ao qual o arquivo será vinculado' },
        uploadable_id: { type: 'number', description: 'ID do recurso pai ao qual o arquivo será vinculado' }
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

// Uploads query tool
export const uploadsQueryTool: Tool = {
  name: 'hudu_search_file_upload_records',
  description: 'Uploads, anexos e arquivos vinculados a recursos no Hudu — busca e filtragem com paginação. Use quando precisar localizar documentos ou arquivos anexados a ativos e empresas no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados dos uploads encontrados.',
  inputSchema: createQuerySchema({}),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Rack Storage resource tool
export const rackStoragesTool: Tool = {
  name: 'hudu_manage_rack_storage_locations',
  description: 'Racks, armários e locais de armazenamento físico em datacenters documentados no Hudu — operações CRUD completas. Use quando precisar cadastrar, editar ou excluir racks e gabinetes de infraestrutura no Hudu. Aceita action (create, get, update, delete). Retorna Markdown com dados do rack processado.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do rack (obrigatório para criação)' },
        location: { type: 'string', description: 'Localização física do rack no datacenter' },
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

// Rack Storage query tool
export const rackStoragesQueryTool: Tool = {
  name: 'hudu_search_rack_storage_locations',
  description: 'Racks, armários e locais de armazenamento físico em datacenters documentados no Hudu — busca e filtragem com paginação. Use quando precisar localizar racks ou gabinetes por empresa no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados dos racks encontrados.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Rack Storage Items resource tool
export const rackStorageItemsTool: Tool = {
  name: 'hudu_manage_rack_storage_items',
  description: 'Equipamentos, servidores e dispositivos montados em racks no Hudu — operações CRUD para itens de rack. Use quando precisar cadastrar, editar ou excluir hardware instalado em um rack específico no Hudu. Requer name e rack_storage_id. Aceita action (create, get, update, delete). Retorna Markdown do item.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do equipamento no rack (obrigatório para criação)' },
        position: { type: 'string', description: 'Posição do item dentro do rack (ex: U1-U4)' },
        rack_storage_id: { type: 'number', description: 'ID do rack onde o item está instalado (obrigatório para criação)' }
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

// Rack Storage Items query tool
export const rackStorageItemsQueryTool: Tool = {
  name: 'hudu_search_rack_storage_items',
  description: 'Equipamentos, servidores e dispositivos montados em racks no Hudu — busca e filtragem com paginação. Use quando precisar localizar hardware instalado em um rack específico por rack_storage_id no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados dos itens encontrados.',
  inputSchema: createQuerySchema({
    rack_storage_id: { type: 'number', description: 'Filtrar por ID do rack' }
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Public Photos resource tool
export const publicPhotosTool: Tool = {
  name: 'hudu_manage_public_photo_gallery',
  description: 'Fotos públicas, imagens e capturas de tela compartilháveis na galeria do Hudu — operações CRUD completas. Use quando precisar publicar, editar ou excluir imagens acessíveis publicamente no Hudu. Aceita action (create, get, update, delete) e campos como nome e URL. Retorna Markdown da foto processada.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da foto (obrigatório para criação)' },
        file_url: { type: 'string', description: 'URL do arquivo de imagem' },
        description: commonProperties.description
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

// Public Photos query tool
export const publicPhotosQueryTool: Tool = {
  name: 'hudu_search_public_photo_gallery',
  description: 'Fotos públicas, imagens e capturas de tela compartilháveis na galeria do Hudu — busca e filtragem com paginação. Use quando precisar localizar imagens publicadas por texto no Hudu. Consulta somente leitura. Retorna lista paginada em Markdown com metadados das fotos encontradas na galeria.',
  inputSchema: createQuerySchema({}),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution functions
export async function executeUploadsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.filename) {
          return createErrorResponse('Name and filename are required for creating uploads');
        }
        const newUpload = await client.createUpload(fields);
        return createSuccessResponse(newUpload, 'Upload created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Upload ID is required for get operation');
        }
        const upload = await client.getUpload(id);
        return createSuccessResponse(upload);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Upload ID is required for update operation');
        }
        const updatedUpload = await client.updateUpload(id, fields || {});
        return createSuccessResponse(updatedUpload, 'Upload updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Upload ID is required for delete operation');
        }
        await client.deleteUpload(id);
        return createSuccessResponse(null, 'Upload deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Uploads operation failed: ${error.message}`);
  }
}

export async function executeUploadsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const uploads = await client.getUploads(args);
    return createSuccessResponse(uploads);
  } catch (error: any) {
    return createErrorResponse(`Uploads query failed: ${error.message}`);
  }
}

export async function executeRackStoragesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Name is required for creating rack storages');
        }
        const newRackStorage = await client.createRackStorage(fields);
        return createSuccessResponse(newRackStorage, 'Rack storage created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Rack storage ID is required for get operation');
        }
        const rackStorage = await client.getRackStorage(id);
        return createSuccessResponse(rackStorage);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Rack storage ID is required for update operation');
        }
        const updatedRackStorage = await client.updateRackStorage(id, fields || {});
        return createSuccessResponse(updatedRackStorage, 'Rack storage updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Rack storage ID is required for delete operation');
        }
        await client.deleteRackStorage(id);
        return createSuccessResponse(null, 'Rack storage deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Rack storages operation failed: ${error.message}`);
  }
}

export async function executeRackStoragesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const rackStorages = await client.getRackStorages(args);
    return createSuccessResponse(rackStorages);
  } catch (error: any) {
    return createErrorResponse(`Rack storages query failed: ${error.message}`);
  }
}

export async function executeRackStorageItemsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.rack_storage_id) {
          return createErrorResponse('Name and rack_storage_id are required for creating rack storage items');
        }
        const newItem = await client.createRackStorageItem(fields);
        return createSuccessResponse(newItem, 'Rack storage item created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Rack storage item ID is required for get operation');
        }
        const item = await client.getRackStorageItem(id);
        return createSuccessResponse(item);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Rack storage item ID is required for update operation');
        }
        const updatedItem = await client.updateRackStorageItem(id, fields || {});
        return createSuccessResponse(updatedItem, 'Rack storage item updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Rack storage item ID is required for delete operation');
        }
        await client.deleteRackStorageItem(id);
        return createSuccessResponse(null, 'Rack storage item deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Rack storage items operation failed: ${error.message}`);
  }
}

export async function executeRackStorageItemsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const items = await client.getRackStorageItems(args);
    return createSuccessResponse(items);
  } catch (error: any) {
    return createErrorResponse(`Rack storage items query failed: ${error.message}`);
  }
}

export async function executePublicPhotosTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Name is required for creating public photos');
        }
        const newPhoto = await client.createPublicPhoto(fields);
        return createSuccessResponse(newPhoto, 'Public photo created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Public photo ID is required for get operation');
        }
        const photo = await client.getPublicPhoto(id);
        return createSuccessResponse(photo);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Public photo ID is required for update operation');
        }
        const updatedPhoto = await client.updatePublicPhoto(id, fields || {});
        return createSuccessResponse(updatedPhoto, 'Public photo updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Public photo ID is required for delete operation');
        }
        await client.deletePublicPhoto(id);
        return createSuccessResponse(null, 'Public photo deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Public photos operation failed: ${error.message}`);
  }
}

export async function executePublicPhotosQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const photos = await client.getPublicPhotos(args);
    return createSuccessResponse(photos);
  } catch (error: any) {
    return createErrorResponse(`Public photos query failed: ${error.message}`);
  }
}