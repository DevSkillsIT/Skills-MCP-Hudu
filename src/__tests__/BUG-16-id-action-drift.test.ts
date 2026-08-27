/**
 * BUG-16 — the `id` parameter advertised actions the tool did not have
 *
 * `commonProperties.id` was one shared literal reading "ID do recurso para
 * operações get, update, delete ou archive", reused by 21 manage_* tools. 17 of
 * them had no `archive` in their action enum, and three were much further off:
 * `hudu_manage_dashboard_widgets` and `hudu_manage_entity_relations` offer only
 * create and delete, `hudu_manage_public_photo_gallery` only update — each
 * naming up to three operations that do not exist.
 *
 * A parameter description is contract text the model reads, so this was
 * teaching actions that answer "Unknown action".
 *
 * The fix derives the sentence from each tool's own enum. This test is the part
 * that keeps it true: a new tool cannot reintroduce the drift without failing
 * here.
 */

import { WORKING_TOOLS } from '../tools/working-index.js';
import { idForActions, idTargetedActions, ID_ACTION_VERBS } from '../tools/schema-utils.js';

const tools = Object.values(WORKING_TOOLS) as any[];

describe('BUG-16 — no tool promises an action it does not have', () => {
  it('covers every registered tool that exposes both action and id', () => {
    const checked = tools.filter((t) => t.inputSchema?.properties?.action?.enum && t.inputSchema?.properties?.id);
    expect(checked.length).toBeGreaterThan(15); // guards against the test going vacuous
  });

  it.each(
    tools
      .filter((t) => t.inputSchema?.properties?.action?.enum && t.inputSchema?.properties?.id?.description)
      .map((t) => [t.name, t] as const)
  )('%s names only actions it actually accepts', (_name, tool) => {
    const actions: string[] = tool.inputSchema.properties.action.enum;
    const desc: string = tool.inputSchema.properties.id.description;

    for (const verb of Object.keys(ID_ACTION_VERBS)) {
      if (actions.includes(verb)) continue;
      // `(verb)` is how the generated sentence names an action; a bare word
      // would false-positive on ordinary prose.
      expect(desc).not.toContain(`(${verb})`);
    }
  });

  it('generates from the enum, listing every id-targeted action', () => {
    const built = idForActions(['create', 'get', 'update', 'delete', 'archive', 'unarchive']);
    expect(built.description).toContain('(get)');
    expect(built.description).toContain('(archive)');
    expect(built.description).not.toContain('(create)'); // create has no id yet
  });

  it('says something sensible when no action targets an id', () => {
    expect(idForActions(['create']).description).toMatch(/recurso existente/i);
  });

  it('idTargetedActions drops create and unknown verbs', () => {
    expect(idTargetedActions(['create', 'get', 'banana'])).toEqual(['get']);
  });
});
