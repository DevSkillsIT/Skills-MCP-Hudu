// Utility functions for converting common patterns to JSON Schema

export const createActionSchema = (actions: string[]) => ({
  type: 'string' as const,
  enum: actions,
  description: 'Action to perform'
});

export const createFieldsSchema = (properties: Record<string, any>) => ({
  type: 'object' as const,
  properties,
  description: 'Data for create/update operations'
});

export const createQuerySchema = (properties: Record<string, any>) => ({
  type: 'object' as const,
  properties: {
    search: { type: 'string', description: 'Search query text' },
    name: { type: 'string', description: 'Filter by name' },
    page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
    page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Results per page' },
    ...properties
  }
});

export const standardActions = ['create', 'get', 'update', 'delete', 'archive', 'unarchive'];
export const basicActions = ['create', 'get', 'update', 'delete'];

export const commonProperties = {
  id: { type: 'number' as const, description: 'ID for get/update/delete/archive operations' },
  company_id: { type: 'number' as const, description: 'Company ID' },
  folder_id: { type: 'number' as const, description: 'Folder ID' },
  name: { type: 'string' as const, description: 'Name' },
  description: { type: 'string' as const, description: 'Description' }
};

export const createStandardToolSchema = (actions: string[]) => ({
  type: 'object' as const,
  properties: {
    action: createActionSchema(actions),
    id: commonProperties.id,
    fields: createFieldsSchema({})
  },
  required: ['action']
});