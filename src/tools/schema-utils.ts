// Utility functions for converting common patterns to JSON Schema

export const createActionSchema = (actions: string[], description?: string) => ({
  type: 'string' as const,
  enum: actions,
  description: description || 'Action to perform'
});

export const createFieldsSchema = (properties: Record<string, any>) => ({
  type: 'object' as const,
  properties,
  description: 'Dados para operações de criação ou atualização'
});

export const createQuerySchema = (properties: Record<string, any>) => ({
  type: 'object' as const,
  properties: {
    search: { type: 'string', description: 'Texto de busca para filtrar resultados' },
    name: { type: 'string', description: 'Filtrar por nome exato ou parcial' },
    page: { type: 'number', minimum: 1, default: 1, description: 'Número da página para paginação' },
    page_size: { type: 'number', minimum: 1, maximum: 100, default: 25, description: 'Quantidade de resultados por página (máximo 100)' },
    ...properties
  }
});

export const standardActions = ['create', 'get', 'update', 'delete', 'archive', 'unarchive'];
export const basicActions = ['create', 'get', 'update', 'delete'];

export const commonProperties = {
  id: { type: 'number' as const, description: 'ID do recurso para operações get, update, delete ou archive' },
  company_id: { type: 'number' as const, description: 'ID da empresa associada' },
  folder_id: { type: 'number' as const, description: 'ID da pasta de organização' },
  name: { type: 'string' as const, description: 'Nome do recurso' },
  description: { type: 'string' as const, description: 'Descrição detalhada do recurso' }
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