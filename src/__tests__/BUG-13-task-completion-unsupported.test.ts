/**
 * BUG-13 — `complete` reported success and did nothing
 *
 * Live proof against Hudu 2.44.3 on 2026-08-27: calling the tool with
 * action="complete" answered `isError: false` and "Tarefa marcada como
 * concluída.", while an independent read of the same task through the REST API
 * still said `completed: false, completion_notes: null`. The tool's own
 * rendered table said "| Concluída | Não |" directly under its success message.
 *
 * Root cause, from the live controller:
 *
 *   def update
 *     @procedure_task.update!(procedure_task_params)
 *   end
 *
 *   def procedure_task_params
 *     params.require(:procedure_task).permit(
 *       :name, :description, :procedure_id, :position,
 *       :due_date, :priority, :optional, :parent_task_id,
 *       assigned_users: [],
 *     )
 *   end
 *
 * `completed` and `completion_notes` are NOT permitted. Rails drops them, the
 * update succeeds having changed nothing, and the tool reported that as done.
 *
 * The official Hudu MCP *can* complete a task (RunTaskCompleteTool) because it
 * runs inside Rails and never passes through strong params. Over the public
 * REST API the capability does not exist. Parity was assumed, not verified.
 *
 * The unit test that shipped with the feature passed because it asserted the
 * payload SENT to the client and never what the server DID with it.
 */

import {
  executeProcedureTasksTool,
  procedureTasksTool,
  API_UNWRITABLE_TASK_FIELDS,
} from '../tools/procedures.js';

function spyClient() {
  const calls: { name: string; args: unknown[] }[] = [];
  const client = {
    updateProcedureTask: (id: number, body: unknown) => {
      calls.push({ name: 'updateProcedureTask', args: [id, body] });
      // Mirrors the server: the unpermitted keys never land, so the record
      // comes back unchanged — which is exactly what made this invisible.
      return Promise.resolve({ id, completed: false, completion_notes: null });
    },
    createProcedureTask: (body: unknown) => {
      calls.push({ name: 'createProcedureTask', args: [body] });
      return Promise.resolve({ id: 1 });
    },
  } as any;
  return { client, calls };
}

describe('BUG-13 — the tool no longer claims a completion it cannot perform', () => {
  it('refuses action=complete instead of reporting a false success', async () => {
    const { client, calls } = spyClient();
    const res = await executeProcedureTasksTool({ action: 'complete', id: 2 }, client);

    expect(res.success).toBe(false);
    expect(calls).toHaveLength(0); // never fire a write that cannot work
  });

  it('names the limitation and the working alternative', async () => {
    const { client } = spyClient();
    const res = await executeProcedureTasksTool({ action: 'complete', id: 2 }, client);

    // An error message is an instruction to the model. It has to say what is
    // impossible AND what still works, or the model just retries.
    expect(res.error).toMatch(/API/i);
    expect(res.error).toMatch(/interface web|MCP oficial/i);
  });

  it('refuses uncomplete for the same reason', async () => {
    const { client, calls } = spyClient();
    const res = await executeProcedureTasksTool({ action: 'uncomplete', id: 2 }, client);
    expect(res.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('refuses an update carrying completed, rather than dropping it in silence', async () => {
    const { client, calls } = spyClient();
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 2, fields: { completed: true } },
      client
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('completed');
    expect(calls).toHaveLength(0);
  });

  it('refuses an update carrying completion_notes', async () => {
    const { client } = spyClient();
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 2, fields: { completion_notes: 'restore ok' } },
      client
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('completion_notes');
  });

  it('still allows the fields the API really does accept', async () => {
    const { client, calls } = spyClient();
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 2, fields: { priority: 'high', due_date: '2026-09-01' } },
      client
    );
    expect(res.success).toBe(true);
    expect(calls[0]!.args[1]).toEqual({ priority: 'high', due_date: '2026-09-01' });
  });

  it('does not advertise complete or uncomplete in the action enum', () => {
    const actions = (procedureTasksTool.inputSchema as any).properties.action.enum;
    expect(actions).not.toContain('complete');
    expect(actions).not.toContain('uncomplete');
  });

  it('does not advertise fields the API silently drops', () => {
    const fields = (procedureTasksTool.inputSchema as any).properties.fields.properties;
    for (const f of API_UNWRITABLE_TASK_FIELDS) {
      expect(fields).not.toHaveProperty(f);
    }
  });
});
