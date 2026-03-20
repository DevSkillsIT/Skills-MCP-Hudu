import { WORKING_TOOLS } from '../../tools/working-index.js';

describe('Tool Annotations', () => {
  test('all tools have annotations object', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      expect(tool.annotations).toBeDefined();
    }
  });

  test('all tools have boolean readOnlyHint annotation', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      expect(typeof (tool.annotations as any)?.readOnlyHint).toBe('boolean');
    }
  });

  test('all tools have boolean destructiveHint annotation', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      expect(typeof (tool.annotations as any)?.destructiveHint).toBe('boolean');
    }
  });

  test('all tools have boolean openWorldHint annotation', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      expect(typeof (tool.annotations as any)?.openWorldHint).toBe('boolean');
    }
  });

  test('search_ tools are readOnly and non-destructive', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      if (name.includes('search_')) {
        expect((tool.annotations as any)?.readOnlyHint).toBe(true);
        expect((tool.annotations as any)?.destructiveHint).toBe(false);
      }
    }
  });

  test('all tools have openWorldHint set to true', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      expect((tool.annotations as any)?.openWorldHint).toBe(true);
    }
  });

  test('manage_ tools are not readOnly', () => {
    for (const [name, tool] of Object.entries(WORKING_TOOLS)) {
      if (name.includes('manage_')) {
        expect((tool.annotations as any)?.readOnlyHint).toBe(false);
      }
    }
  });
});
