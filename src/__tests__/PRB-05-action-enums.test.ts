/**
 * PRB-05: Manage action enum cleanup vs Hudu API 2.41.2 (REQ-16)
 *
 * Snapshot of every manage tool's action enum, validated against
 * what the Hudu API actually supports.
 *
 * Hudu API endpoint analysis:
 * - /relations: GET(list), POST, DELETE/{id} — no GET by ID, no PUT
 * - /magic_dash: GET(list), POST, DELETE — no GET by ID, no PUT
 * - /uploads/{id}: GET, DELETE — no PUT (update)
 * - /public_photos/{id}: PUT only — no GET by ID, no DELETE
 *
 * WIP ref: wip/hudu-pre-spec-2026-05-19 removed get/update from relations
 */

import { relationsTool } from '../tools/relations.js';
import { magicDashTool } from '../tools/magic-dash.js';
import { uploadsTool, publicPhotosTool } from '../tools/storage.js';
import { articlesTool } from '../tools/articles.js';
import { companiesTool } from '../tools/companies.js';
import { assetsTool } from '../tools/assets.js';
import { passwordsTool } from '../tools/passwords.js';
import { proceduresTool, procedureTasksTool } from '../tools/procedures.js';
import { assetLayoutsTool } from '../tools/asset-layouts.js';

function getActionEnum(tool: any): string[] {
  return tool.inputSchema?.properties?.action?.enum ?? [];
}

describe('PRB-05: Action enum validation vs Hudu API 2.41.2', () => {
  test('manage_entity_relations — only create and delete supported', () => {
    const actions = getActionEnum(relationsTool);
    expect(actions).toContain('create');
    expect(actions).toContain('delete');
    // Hudu /relations/{id} has no GET or PUT endpoint
    expect(actions).not.toContain('get');
    expect(actions).not.toContain('update');
  });

  test('manage_dashboard_widgets — only create and delete supported', () => {
    const actions = getActionEnum(magicDashTool);
    expect(actions).toContain('create');
    expect(actions).toContain('delete');
    // Hudu /magic_dash/{id} has no GET or PUT endpoint
    expect(actions).not.toContain('get');
    expect(actions).not.toContain('update');
  });

  test('manage_file_upload_records — only get and delete supported (no PUT in API)', () => {
    const actions = getActionEnum(uploadsTool);
    expect(actions).toContain('get');
    expect(actions).toContain('delete');
    // Hudu /uploads/{id} has no PUT endpoint
    expect(actions).not.toContain('update');
  });

  test('manage_public_photo_gallery — only update supported (PUT by ID only)', () => {
    const actions = getActionEnum(publicPhotosTool);
    expect(actions).toContain('update');
    // Hudu /public_photos/{id} only has PUT
    // No GET by ID, no DELETE by ID
    expect(actions).not.toContain('get');
    expect(actions).not.toContain('delete');
  });

  // Snapshot: tools with correct standardActions (create, get, update, delete, archive, unarchive)
  test('manage_knowledge_articles has standard actions including archive', () => {
    const actions = getActionEnum(articlesTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
    expect(actions).toContain('archive');
    expect(actions).toContain('unarchive');
  });

  test('manage_company_information has standard actions including archive', () => {
    const actions = getActionEnum(companiesTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
    expect(actions).toContain('archive');
    expect(actions).toContain('unarchive');
  });

  test('manage_it_asset_inventory has standard actions including archive', () => {
    const actions = getActionEnum(assetsTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
    expect(actions).toContain('archive');
    expect(actions).toContain('unarchive');
  });

  test('manage_password_credentials has standard actions including archive', () => {
    const actions = getActionEnum(passwordsTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
  });

  test('manage_asset_layout_templates has create, get, update only (no delete in API)', () => {
    const actions = getActionEnum(assetLayoutsTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).not.toContain('delete');
  });

  test('manage_workflow_procedures has extended actions including kickoff', () => {
    const actions = getActionEnum(proceduresTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
    expect(actions).toContain('kickoff');
    expect(actions).toContain('duplicate');
  });

  test('manage_procedure_task_items has basic CRUD actions', () => {
    const actions = getActionEnum(procedureTasksTool);
    expect(actions).toContain('create');
    expect(actions).toContain('get');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
  });
});
