/**
 * BUG-03: Public photo gallery ID type consistency
 *
 * Investigation finding: OpenAPI spec (Hudu.json) and TypeScript interface
 * HuduPublicPhoto (src/types.ts) both declare id as integer/number.
 * The publicPhotosTool schema also uses commonProperties.id = { type: 'number' }.
 * The manage tool schema is already consistent.
 *
 * The SPEC hypothesis about string slugs (e.g. "9bfa1154daa6") was NOT confirmed
 * by the OpenAPI spec — the GET /public_photos/{id} endpoint uses integer path param.
 *
 * However: the HuduPublicPhoto interface in types.ts is missing fields that the
 * real API returns (url, record_type, record_id) relative to the OpenAPI definition.
 * The types.ts has { id, name, filename, url, created_at, updated_at } but the
 * OpenAPI PublicPhoto definition has { id, url, record_type, record_id }.
 *
 * Real bug confirmed: The manage tool's id schema is { type: 'number' } which is
 * correct. The search tool's query schema does NOT include an `id` field — which is
 * also correct for a search (list) tool. Type consistency is maintained.
 *
 * This test characterizes the CURRENT behavior to catch regressions:
 * - publicPhotosTool.inputSchema.properties.id.type === 'number' (consistent with search return)
 * - publicPhotosQueryTool has no id field in required or properties
 * - HuduPublicPhoto interface uses id: number
 *
 * REQ: REQ-03 / SPEC-HUDU-FIX-001
 */

import { describe, test, expect } from '@jest/globals';
import { publicPhotosTool, publicPhotosQueryTool } from '../tools/storage.js';
describe('BUG-03: Public photo gallery ID type consistency', () => {
  describe('manage tool schema (hudu_manage_public_photo_gallery)', () => {
    test('id property type is number (consistent with API returning integer ids)', () => {
      const schema = publicPhotosTool.inputSchema as any;
      expect(schema.properties.id.type).toBe('number');
    });

    test('action enum does not include create (photo upload requires multipart)', () => {
      const schema = publicPhotosTool.inputSchema as any;
      expect(schema.properties.action.enum).not.toContain('create');
      expect(schema.properties.action.enum).toContain('get');
      expect(schema.properties.action.enum).toContain('update');
      expect(schema.properties.action.enum).toContain('delete');
    });

    test('action is required in manage tool', () => {
      const schema = publicPhotosTool.inputSchema as any;
      expect(schema.required).toContain('action');
    });
  });

  describe('search/query tool schema (hudu_search_public_photo_gallery)', () => {
    test('query tool has standard search properties', () => {
      const schema = publicPhotosQueryTool.inputSchema as any;
      expect(schema.properties).toHaveProperty('search');
      expect(schema.properties).toHaveProperty('page');
      expect(schema.properties).toHaveProperty('page_size');
    });

    test('query tool search param type is string (text search)', () => {
      const schema = publicPhotosQueryTool.inputSchema as any;
      expect(schema.properties.search.type).toBe('string');
    });

    test('id field NOT present in search/query tool (list endpoint takes no id filter)', () => {
      // The OpenAPI GET /public_photos has no id parameter — search is by text
      const schema = publicPhotosQueryTool.inputSchema as any;
      expect(schema.properties).not.toHaveProperty('id');
    });
  });

  describe('type consistency between search return and manage input', () => {
    test('manage tool id is number — matches OpenAPI integer type for GET /public_photos/{id}', () => {
      // OpenAPI spec: GET /public_photos/{id} path param is integer
      // manage tool: id property is { type: "number" }
      // These are consistent — no type mismatch
      const manageSchema = publicPhotosTool.inputSchema as any;
      expect(manageSchema.properties.id.type).toBe('number');
    });

    test('tool names follow naming convention (no hudu_ prefix since P3-A)', () => {
      expect(publicPhotosTool.name).toBe('manage_public_photo_gallery');
      expect(publicPhotosQueryTool.name).toBe('search_public_photo_gallery');
    });
  });
});
