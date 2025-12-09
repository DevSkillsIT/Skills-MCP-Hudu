import { z } from 'zod';

// Base schemas for consistent tool structure
export const BaseActionSchema = z.enum(['create', 'get', 'update', 'delete', 'archive', 'unarchive']);

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  page_size: z.number().min(1).max(100).default(25).optional()
});

export const SearchSchema = z.object({
  search: z.string().optional().describe('Search query text'),
  name: z.string().optional().describe('Filter by name')
});

// Standard tool response interface
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to create consistent error responses
export function createErrorResponse(error: string): ToolResponse {
  return {
    success: false,
    error
  };
}

// Helper function to create consistent success responses
export function createSuccessResponse<T>(data: T, message?: string): ToolResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

// Common field schemas that are reused across resources
export const CommonFieldSchemas = {
  company_id: z.number().optional().describe('Company ID'),
  folder_id: z.number().optional().describe('Folder ID'),
  name: z.string().optional().describe('Name'),
  description: z.string().optional().describe('Description'),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
};