import { describe, test, expect } from '@jest/globals';
import { WORKING_TOOLS } from '../../tools/working-index.js';

/**
 * Wire-level validation: verifies that the tool objects emitted to MCP clients
 * include the annotations property with all required boolean fields.
 *
 * This simulates what a client would see after calling tools/list.
 */

describe('tools/list wire-level annotations', () => {
  const tools = Object.values(WORKING_TOOLS);

  test('every tool has annotations object', () => {
    for (const tool of tools) {
      expect(tool).toHaveProperty('annotations');
      expect(tool.annotations).toBeDefined();
      expect(typeof tool.annotations).toBe('object');
    }
  });

  test('every tool exposes readOnlyHint boolean', () => {
    for (const tool of tools) {
      const ann = tool.annotations as Record<string, unknown>;
      expect(typeof ann.readOnlyHint).toBe('boolean');
    }
  });

  test('every tool exposes destructiveHint boolean', () => {
    for (const tool of tools) {
      const ann = tool.annotations as Record<string, unknown>;
      expect(typeof ann.destructiveHint).toBe('boolean');
    }
  });

  test('every tool exposes openWorldHint boolean', () => {
    for (const tool of tools) {
      const ann = tool.annotations as Record<string, unknown>;
      expect(typeof ann.openWorldHint).toBe('boolean');
    }
  });

  test('search tools have readOnlyHint=true and destructiveHint=false', () => {
    for (const tool of tools) {
      if (tool.name.includes('search_') || tool.name.includes('navigate_')) {
        const ann = tool.annotations as Record<string, unknown>;
        expect(ann.readOnlyHint).toBe(true);
        expect(ann.destructiveHint).toBe(false);
      }
    }
  });

  test('admin tool has readOnlyHint=true', () => {
    for (const tool of tools) {
      if (tool.name === 'hudu_admin_instance_operations') {
        const ann = tool.annotations as Record<string, unknown>;
        expect(ann.readOnlyHint).toBe(true);
      }
    }
  });

  test('all 43+ tools have openWorldHint=true', () => {
    expect(tools.length).toBeGreaterThanOrEqual(43);
    for (const tool of tools) {
      const ann = tool.annotations as Record<string, unknown>;
      expect(ann.openWorldHint).toBe(true);
    }
  });

  test('annotation shape matches MCP specification', () => {
    // MCP spec requires annotations to be an object with optional boolean hints
    for (const tool of tools) {
      const ann = tool.annotations as Record<string, unknown>;
      const allowedKeys = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'];
      for (const key of Object.keys(ann)) {
        expect(allowedKeys).toContain(key);
      }
    }
  });
});
