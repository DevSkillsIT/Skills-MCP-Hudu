/**
 * BUG-01: Prompt argument validation — characterization/regression test
 *
 * Bug: The GetPromptRequestSchema handler in server.ts calls getHuduPromptText(name, args)
 * WITHOUT validating required arguments first. When a required arg is missing, the function
 * interpolates `undefined` directly into the prompt template (e.g. `${company_id}` becomes
 * "undefined"), producing a nonsensical prompt instead of a clear error.
 *
 * 7 prompts declare required:true in HUDU_PROMPTS_LIST:
 *   - hudu_client_maturity       → company_id
 *   - hudu_quick_search          → query
 *   - hudu_password_lookup       → search_term
 *   - hudu_asset_history         → asset_id
 *   - hudu_new_client_setup      → company_name
 *   - hudu_documentation_checklist → company_id
 *   - hudu_troubleshooting_wiki  → search_query
 *
 * Fix target: src/server.ts — validatePromptArgs() guard before getHuduPromptText()
 *
 * FAILURE EVIDENCE (pre-fix run):
 *   Expected: error shape { error: "MISSING_REQUIRED_ARG", ... }
 *   Received: no error thrown — prompt text with "undefined" interpolated
 *
 * REQ: REQ-01 / SPEC-HUDU-FIX-001
 */

import { describe, test, expect } from '@jest/globals';
import { HUDU_PROMPTS_LIST, validatePromptArgs } from '../prompts.js';
import { executeGetPromptTool } from '../tools/prompt-tools.js';

describe('BUG-01: validatePromptArgs — missing required arguments', () => {
  // === Prompts that REQUIRE args: must return error shape ===

  test('hudu_client_maturity: missing company_id returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_client_maturity', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_client_maturity',
      required: expect.arrayContaining(['company_id']),
      provided: expect.any(Array)
    });
  });

  test('hudu_quick_search: missing query returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_quick_search', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_quick_search',
      required: expect.arrayContaining(['query']),
    });
  });

  test('hudu_password_lookup: missing search_term returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_password_lookup', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_password_lookup',
      required: expect.arrayContaining(['search_term']),
    });
  });

  test('hudu_asset_history: missing asset_id returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_asset_history', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_asset_history',
      required: expect.arrayContaining(['asset_id']),
    });
  });

  test('hudu_new_client_setup: missing company_name returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_new_client_setup', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_new_client_setup',
      required: expect.arrayContaining(['company_name']),
    });
  });

  test('hudu_documentation_checklist: missing company_id returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_documentation_checklist', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_documentation_checklist',
      required: expect.arrayContaining(['company_id']),
    });
  });

  test('hudu_troubleshooting_wiki: missing search_query returns MISSING_REQUIRED_ARG', () => {
    const result = validatePromptArgs('hudu_troubleshooting_wiki', {});
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      error: 'MISSING_REQUIRED_ARG',
      prompt: 'hudu_troubleshooting_wiki',
      required: expect.arrayContaining(['search_query']),
    });
  });

  // === Counter-scenario: valid args must return null (no error) ===

  test('hudu_client_maturity: with company_id provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_client_maturity', { company_id: '42' });
    expect(result).toBeNull();
  });

  test('hudu_quick_search: with query provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_quick_search', { query: 'firewall' });
    expect(result).toBeNull();
  });

  test('hudu_password_lookup: with search_term provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_password_lookup', { search_term: 'ssh' });
    expect(result).toBeNull();
  });

  test('hudu_asset_history: with asset_id provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_asset_history', { asset_id: '99' });
    expect(result).toBeNull();
  });

  test('hudu_new_client_setup: with company_name provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_new_client_setup', { company_name: 'Acme' });
    expect(result).toBeNull();
  });

  test('hudu_documentation_checklist: with company_id provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_documentation_checklist', { company_id: '1' });
    expect(result).toBeNull();
  });

  test('hudu_troubleshooting_wiki: with search_query provided returns null (no error)', () => {
    const result = validatePromptArgs('hudu_troubleshooting_wiki', { search_query: 'VPN' });
    expect(result).toBeNull();
  });

  // === Optional-args prompts: always return null ===

  test('hudu_security_audit: no required args — always null', () => {
    const result = validatePromptArgs('hudu_security_audit', {});
    expect(result).toBeNull();
  });

  test('hudu_asset_report: no required args — always null', () => {
    const result = validatePromptArgs('hudu_asset_report', {});
    expect(result).toBeNull();
  });

  test('hudu_executive_dashboard: no required args — always null even with empty args', () => {
    const result = validatePromptArgs('hudu_executive_dashboard', {});
    expect(result).toBeNull();
  });

  test('hudu_documentation_coverage: no required args — always null', () => {
    const result = validatePromptArgs('hudu_documentation_coverage', {});
    expect(result).toBeNull();
  });

  test('hudu_contact_directory: no required args — always null', () => {
    const result = validatePromptArgs('hudu_contact_directory', {});
    expect(result).toBeNull();
  });

  test('hudu_recent_changes: no required args — always null', () => {
    const result = validatePromptArgs('hudu_recent_changes', {});
    expect(result).toBeNull();
  });

  // === Edge cases ===

  test('unknown prompt: returns null (unknown prompts are not validated)', () => {
    const result = validatePromptArgs('hudu_nonexistent_prompt', {});
    expect(result).toBeNull();
  });

  test('null args treated as empty: triggers validation for required args', () => {
    const result = validatePromptArgs('hudu_quick_search', null as any);
    expect(result).not.toBeNull();
    expect(result?.error).toBe('MISSING_REQUIRED_ARG');
  });

  test('HUDU_PROMPTS_LIST correctly identifies 7 prompts with required args', () => {
    const promptsWithRequired = HUDU_PROMPTS_LIST.filter(
      (p: any) => p.arguments?.some((a: any) => a.required === true)
    );
    expect(promptsWithRequired).toHaveLength(7);
    const names = promptsWithRequired.map((p: any) => p.name);
    expect(names).toContain('hudu_client_maturity');
    expect(names).toContain('hudu_quick_search');
    expect(names).toContain('hudu_password_lookup');
    expect(names).toContain('hudu_asset_history');
    expect(names).toContain('hudu_new_client_setup');
    expect(names).toContain('hudu_documentation_checklist');
    expect(names).toContain('hudu_troubleshooting_wiki');
  });
});

// REQ-01 live-gap regression: the hudu_get_prompt BRIDGE TOOL path
// (executeGetPromptTool) must enforce validation too. Before the fix it
// called getHuduPromptText directly and leaked literal "undefined" into the
// rendered body — proven against the live server on 2026-05-21.
describe('BUG-01: hudu_get_prompt bridge tool enforces validation', () => {
  test('missing required arg returns an error and never leaks "undefined"', async () => {
    const result = await executeGetPromptTool({ name: 'hudu_client_maturity', arguments: {} }, {} as any);
    expect(result.success).toBe(false);
    const text = JSON.stringify(result);
    expect(text).toContain('company_id');
    expect(text).not.toContain('undefined');
  });

  test('valid required arg renders the prompt without "undefined"', async () => {
    const result = await executeGetPromptTool(
      { name: 'hudu_client_maturity', arguments: { company_id: '42' } },
      {} as any
    );
    expect(result.success).toBe(true);
    const text = JSON.stringify(result);
    expect(text).not.toContain('undefined');
    expect(text).toContain('42');
  });

  test('prompt with no required args still renders via the bridge tool', async () => {
    const result = await executeGetPromptTool({ name: 'hudu_security_audit', arguments: {} }, {} as any);
    expect(result.success).toBe(true);
  });
});
