import { z } from 'zod';

// Base schemas for consistent tool structure
export const BaseActionSchema = z.enum(['create', 'get', 'update', 'delete', 'archive', 'unarchive']);

/**
 * Unused. Kept out of the schemas on purpose: the live cap is 1000
 * (`HUDU_MAX_PAGE_SIZE` in schema-utils.ts), and a second declaration saying 25
 * is how the wrong number stays alive in the codebase. Delete on sight if it is
 * still unreferenced.
 */
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  page_size: z.number().min(1).max(1000).default(25).optional()
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
  /**
   * Caveat that must travel WITH the answer, not merely be logged.
   *
   * `message` is not a substitute: server.ts only falls back to it when the
   * formatter produced nothing, so anything important said there is invisible
   * whenever a tool renders a table. A warning is prepended to the rendered
   * output instead.
   */
  warning?: string;
}

export type ToolExecutor = (args: any, client: any) => Promise<ToolResponse>;

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

/** Same as createSuccessResponse, plus a caveat rendered above the answer. */
export function createWarnedResponse<T>(
  data: T,
  warning: string | null,
  message?: string
): ToolResponse<T> {
  const res = createSuccessResponse(data, message);
  if (warning) res.warning = warning;
  return res;
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
