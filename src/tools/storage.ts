import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, basicActions, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Uploads resource tool
export const uploadsTool: Tool = {
  name: 'uploads',
  description: 'Create and manage file uploads',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Upload name' },
        filename: { type: 'string', description: 'File name' },
        content_type: { type: 'string', description: 'Content type' },
        uploadable_type: { type: 'string', description: 'Uploadable type' },
        uploadable_id: { type: 'number', description: 'Uploadable ID' }
      })
    },
    required: ['action']
  }
};

// Uploads query tool
export const uploadsQueryTool: Tool = {
  name: 'uploads.query',
  description: 'Search and filter uploads with pagination',
  inputSchema: createQuerySchema({})
};

// Rack Storage resource tool
export const rackStoragesTool: Tool = {
  name: 'rack_storages',
  description: 'Create and manage rack storage locations',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Rack storage name' },
        location: { type: 'string', description: 'Rack storage location' },
        company_id: commonProperties.company_id
      })
    },
    required: ['action']
  }
};

// Rack Storage query tool
export const rackStoragesQueryTool: Tool = {
  name: 'rack_storages.query',
  description: 'Search and filter rack storages with pagination',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  })
};

// Rack Storage Items resource tool
export const rackStorageItemsTool: Tool = {
  name: 'rack_storage_items',
  description: 'Create and manage items within rack storage',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Rack storage item name' },
        position: { type: 'string', description: 'Position in rack storage' },
        rack_storage_id: { type: 'number', description: 'Rack storage ID' }
      })
    },
    required: ['action']
  }
};

// Rack Storage Items query tool
export const rackStorageItemsQueryTool: Tool = {
  name: 'rack_storage_items.query',
  description: 'Search and filter rack storage items with pagination',
  inputSchema: createQuerySchema({
    rack_storage_id: { type: 'number', description: 'Filter by rack storage ID' }
  })
};

// Public Photos resource tool
export const publicPhotosTool: Tool = {
  name: 'public_photos',
  description: 'Create and manage public photos',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(basicActions),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Photo name' },
        file_url: { type: 'string', description: 'Photo file URL' },
        description: commonProperties.description
      })
    },
    required: ['action']
  }
};

// Public Photos query tool
export const publicPhotosQueryTool: Tool = {
  name: 'public_photos.query',
  description: 'Search and filter public photos with pagination',
  inputSchema: createQuerySchema({})
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