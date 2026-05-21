import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Uploads resource tool
// REQ-16 / PRB-05: Hudu API 2.41.2 exposes GET /uploads/{id} and DELETE
// /uploads/{id} but NOT PUT. Upload itself (POST) is multipart/form-data
// and not viable via JSON MCP args. The action enum therefore lists only
// get and delete.
export const uploadsTool: Tool = {
  name: 'hudu_manage_file_upload_records',
  description: 'Uploads, anexos e arquivos vinculados a recursos no Hudu — consulta de metadados e remoção por ID. Criação (upload) exige multipart/form-data com arquivo binário e não é suportada via MCP — use a UI do Hudu. A API do Hudu 2.41.2 não expõe PUT para uploads, portanto update não está disponível. Aceita action (get, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'delete'],
        description: 'Ação a executar. Valores: get (obter por ID), delete (excluir por ID). A API do Hudu 2.41.2 não suporta update para uploads; para substituir um arquivo, exclua e faça novo upload via UI.'
      },
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Novo nome descritivo do upload' },
        uploadable_type: { type: 'string', description: 'Tipo do recurso pai (ex: Asset, Article)' },
        uploadable_id: { type: 'number', description: 'ID do recurso pai ao qual o arquivo está vinculado' }
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
// OpenAPI: POST /rack_storages — dimensions are typically required by the
// backend validator: height (rack units), width, starting_unit. location_id
// references a location record (integer), NOT a free-text location string.
export const rackStoragesTool: Tool = {
  name: 'hudu_manage_rack_storage_locations',
  description: 'Racks, armários e locais de armazenamento físico em datacenters documentados no Hudu — operações CRUD completas. Use quando precisar cadastrar, editar ou excluir racks e gabinetes no Hudu. Para criação, obrigatório: name, company_id, height (U), width, starting_unit. Aceita action (create, get, update, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: {
        type: 'object',
        description: 'Dados para operações de criação ou atualização',
        properties: {
          name: { type: 'string', description: 'Nome do rack (obrigatório para criação)' },
          company_id: { type: 'number', description: 'ID da empresa proprietária do rack (obrigatório para criação)' },
          height: { type: 'number', minimum: 1, description: 'Altura do rack em unidades (U), ex: 42 (obrigatório para criação)' },
          width: { type: 'number', minimum: 1, description: 'Largura do rack em polegadas, ex: 19 (obrigatório para criação)' },
          starting_unit: { type: 'number', description: 'Unidade inicial do rack (1 = numeração ascendente, ou valor alto p/ descendente) (obrigatório para criação)' },
          description: { type: 'string', description: 'Descrição do rack' },
          max_wattage: { type: 'number', description: 'Capacidade máxima de watts do rack (opcional)' },
          location_id: { type: 'number', description: 'ID do registro de localização física (opcional)' }
        },
        required: ['name', 'company_id', 'height', 'width', 'starting_unit']
      }
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
// OpenAPI: POST /rack_storage_items uses { rack_storage_role_id, asset_id,
// start_unit, end_unit, status, side }. There is NO `name` field and NO
// top-level `rack_storage_id` — the item is linked to a rack via a role
// record (rack_storage_role_id). This reflects Hudu's physical model where
// a role groups items within a specific rack.
export const rackStorageItemsTool: Tool = {
  name: 'hudu_manage_rack_storage_items',
  description: 'Equipamentos, servidores e dispositivos montados em racks no Hudu — operações CRUD para itens de rack. Use quando precisar cadastrar, editar ou excluir hardware instalado em racks no Hudu. Para criação, obrigatório: rack_storage_role_id, start_unit, end_unit. Aceita action (create, get, update, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions, 'Ação a executar. Valores: create (criar novo registro), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        rack_storage_role_id: { type: 'number', description: 'ID do papel (role) do rack onde o item será montado (obrigatório para criação — consulte roles do rack primeiro)' },
        asset_id: { type: 'number', description: 'ID do ativo Hudu que ocupa esta posição (opcional; informar quando o hardware já existir no inventário de ativos)' },
        start_unit: { type: 'number', description: 'Unidade U inicial ocupada no rack (obrigatório para criação)' },
        end_unit: { type: 'number', description: 'Unidade U final ocupada no rack (obrigatório para criação)' },
        status: { type: 'string', enum: ['active', 'reserved', 'planned', 'decommissioned'], description: 'Status do item. Valores: active, reserved, planned, decommissioned' },
        side: { type: 'string', enum: ['front', 'back'], description: 'Lado do rack. Valores: front, back' },
        max_wattage: { type: 'number', description: 'Consumo máximo de energia em watts (opcional)' },
        power_draw: { type: 'number', description: 'Consumo real de energia em watts (opcional)' },
        reserved_message: { type: 'string', description: 'Mensagem para posições reservadas' }
      }, ['rack_storage_role_id', 'start_unit', 'end_unit'])
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
// NOTE: Hudu API requires rack_storage_id as a filter; calling the endpoint
// without it returns HTTP 400. We enforce the constraint in the schema AND
// in the executor to give a clear error message before hitting the API.
export const rackStorageItemsQueryTool: Tool = {
  name: 'hudu_search_rack_storage_items',
  description: 'Equipamentos, servidores e dispositivos montados em racks no Hudu — busca e filtragem com paginação. Use quando precisar localizar hardware instalado em um rack específico no Hudu. Exige rack_storage_id obrigatório — descubra IDs via hudu_search_rack_storage_locations. Consulta somente leitura. Retorna lista paginada em Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      ...createQuerySchema({}).properties,
      rack_storage_id: { type: 'number', description: 'ID do rack a pesquisar (obrigatório — API do Hudu rejeita busca ampla)' }
    },
    required: ['rack_storage_id']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Public Photos resource tool
// REQ-16 / PRB-05: Hudu API 2.41.2 only exposes PUT /public_photos/{id}
// for this resource — there is no GET-by-ID, no DELETE-by-ID, and POST is
// multipart-only (not viable via JSON MCP args). The action enum therefore
// lists only update. Use search_public_photo_gallery to list photos.
export const publicPhotosTool: Tool = {
  name: 'hudu_manage_public_photo_gallery',
  description: 'Fotos públicas, imagens e capturas de tela compartilháveis na galeria do Hudu — operação disponível: atualizar metadados (PUT) por ID. A API do Hudu 2.41.2 NÃO expõe GET por ID nem DELETE por ID; para listar fotos use search_public_photo_gallery. Criação requer upload binário e deve ser feita via UI do Hudu. Aceita action (update). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['update'],
        description: 'Ação a executar. Valor: update (atualizar metadados por ID). A API do Hudu 2.41.2 não suporta get-by-id ou delete-by-id para fotos públicas; criação requer upload binário via UI.'
      },
      id: commonProperties.id,
      fields: {
        type: 'object',
        description: 'Dados para operação de atualização',
        properties: {
          record_type: { type: 'string', description: 'Tipo do registro ao qual a foto está associada, ex: Article, Asset' },
          record_id: { type: 'number', description: 'ID do registro ao qual a foto está associada' }
        }
      }
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
        return createErrorResponse(
          'A criação de uploads no Hudu exige multipart/form-data com arquivo binário (field=file) e não é suportada via MCP. ' +
          'Faça o upload pela interface web do Hudu e depois use action=update para ajustar metadados.'
        );
        
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
        if (!fields?.name || !fields?.company_id || !fields?.height || !fields?.width || !fields?.starting_unit) {
          return createErrorResponse(
            'name, company_id, height, width e starting_unit são obrigatórios para criar racks no Hudu. ' +
            'Exemplo: { name: "Rack-A1", company_id: 1, height: 42, width: 19, starting_unit: 1 }'
          );
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
        if (!fields?.rack_storage_role_id || fields?.start_unit === undefined || fields?.end_unit === undefined) {
          return createErrorResponse(
            'rack_storage_role_id, start_unit e end_unit são obrigatórios para criar itens de rack no Hudu. ' +
            'Exemplo: { rack_storage_role_id: 5, start_unit: 1, end_unit: 2, status: "active", side: "front" }'
          );
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
  if (!args?.rack_storage_id) {
    return createErrorResponse(
      'rack_storage_id é obrigatório. A API do Hudu rejeita a busca ampla com HTTP 400. ' +
      'Use hudu_search_rack_storage_locations para descobrir os IDs de racks disponíveis.'
    );
  }
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
        // Hudu's /public_photos endpoint requires multipart/form-data with
        // a binary `photo` file — impossible to perform reliably via JSON
        // MCP arguments. Explicitly reject with a helpful message.
        return createErrorResponse(
          'A criação de fotos públicas no Hudu exige upload de arquivo binário (multipart/form-data) e não é suportada via MCP. ' +
          'Faça o upload da imagem diretamente pela interface web do Hudu e depois use action=update para ajustar metadados.'
        );

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