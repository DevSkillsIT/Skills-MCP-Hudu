/**
 * REQ-15 — Processes vs Runs, rich tasks, and the page_size ceiling
 *
 * `GET /procedures` returns processes (the definition) and runs (one execution
 * of a process) in the same list. The MCP exposed neither the `type` filter nor
 * the `status` / `completion_percentage` the API already sends, so "quais
 * execuções estão em andamento?" came back as an undifferentiated list where a
 * finished run and an untouched template look alike.
 *
 * Live shapes below are from Hudu 2.44.3 on 2026-08-27.
 */

import {
  formatProcedureList,
  formatProcedureDetail,
  formatProcedureTaskList,
  formatProcedureTaskDetail,
  toPagedResponse,
} from '../formatters/markdown.js';
import { proceduresQueryTool, procedureTasksTool, executeProcedureTasksTool } from '../tools/procedures.js';
import { HUDU_MAX_PAGE_SIZE, paginationProperties } from '../tools/schema-utils.js';
import type { HuduProcedure } from '../types.js';

// Real payloads, trimmed to the fields under test.
const processo = {
  id: 9,
  name: 'Rearm dos Servidores',
  company_id: 1,
  company_name: 'ACME',
  archived: false,
  total: 1,
  completed: 0,
  completion_percentage: '0%',
  run: false,
  parent_process_id: null,
  process_type: 'company',
  status: 'Not Started',
  created_at: '2026-01-01',
  updated_at: '2026-01-02',
} as unknown as HuduProcedure;

const execucao = {
  id: 6,
  name: 'teste',
  archived: false,
  total: 1,
  completed: 1,
  completion_percentage: '100%',
  run: true,
  parent_process_id: 10,
  process_type: null,
  status: 'Completed',
  created_at: '2026-01-01',
  updated_at: '2026-01-02',
} as unknown as HuduProcedure;

const templateGlobal = { ...processo, id: 1, company_id: undefined, company_name: undefined, process_type: 'global' } as unknown as HuduProcedure;

describe('REQ-15 — the search tool can separate process from run', () => {
  const props = (proceduresQueryTool.inputSchema as any).properties;

  it('exposes type with exactly the two values the API accepts', () => {
    expect(props.type.enum).toEqual(['process', 'run']);
  });

  it('exposes process_scope, parent_process_id and archived', () => {
    expect(props.process_scope.enum).toEqual(['global', 'company']);
    expect(props).toHaveProperty('parent_process_id');
    expect(props).toHaveProperty('archived');
  });

  it('exposes the date-range filters the API supports', () => {
    expect(props.created_at.description).toMatch(/vírgula/);
    expect(props).toHaveProperty('updated_at');
  });
});

describe('REQ-15 — rendering tells the two apart', () => {
  it('labels a run as Execução and a company process as Processo', () => {
    const md = formatProcedureList(toPagedResponse([processo, execucao]));
    expect(md).toContain('Execução');
    expect(md).toContain('Processo');
  });

  it('labels a company-less process as a global template', () => {
    const md = formatProcedureList(toPagedResponse([templateGlobal]));
    expect(md).toContain('Template global');
  });

  it('surfaces status and progress, which were absent before', () => {
    const md = formatProcedureList(toPagedResponse([execucao]));
    expect(md).toContain('Completed');
    expect(md).toContain('1/1 (100%)');
  });

  it('warns when the page mixes the two kinds', () => {
    const mixed = formatProcedureList(toPagedResponse([processo, execucao]));
    expect(mixed).toMatch(/mistura processos e execuções/i);

    const pure = formatProcedureList(toPagedResponse([processo]));
    expect(pure).not.toMatch(/mistura processos e execuções/i);
  });

  it('names the parent process on a run detail, not on a process detail', () => {
    expect(formatProcedureDetail(execucao)).toContain('Processo de origem');
    expect(formatProcedureDetail(processo)).not.toContain('Processo de origem');
  });

  it('renders the tasks that a show response carries inline', () => {
    const withTasks = {
      ...execucao,
      procedure_tasks_attributes: [
        { id: 1, name: 'Conferir backup', completed: true, first_assigned_user_name: 'Ana', due_date: '2026-02-01' },
      ],
    } as unknown as HuduProcedure;
    const md = formatProcedureDetail(withTasks);
    expect(md).toContain('Conferir backup');
    expect(md).toContain('Ana');
    expect(md).toContain('2026-02-01');
  });

  it('treats a record with a parent as a run even if `run` is absent', () => {
    const legacy = { ...execucao, run: undefined } as unknown as HuduProcedure;
    expect(formatProcedureList(toPagedResponse([legacy]))).toContain('Execução');
  });
});

describe('REQ-15 — tasks carry deadline, owner and subtasks', () => {
  const task = {
    id: 3,
    name: 'Validar restore',
    procedure_id: 6,
    position: 2,
    completed: true,
    completed_date: '2026-02-02',
    user_name: 'Bruno',
    completion_notes: 'restore ok',
    due_date: '2026-02-01',
    formatted_due_date: '01/02/2026',
    priority: 'high',
    optional: false,
    assigned_users: [10, 11],
    first_assigned_user_name: 'Ana',
    parent_task_id: 1,
    subtask_ids: [4, 5],
    subtask_count: 2,
    has_subtasks: true,
  };

  it('shows owner, deadline, priority and subtask count in the list', () => {
    const md = formatProcedureTaskList(toPagedResponse([task]));
    expect(md).toContain('Ana');
    expect(md).toContain('2026-02-01');
    expect(md).toContain('high');
  });

  it('shows who completed it, when, and the notes', () => {
    const md = formatProcedureTaskDetail(task);
    expect(md).toContain('Bruno');
    expect(md).toContain('2026-02-02');
    expect(md).toContain('restore ok');
    expect(md).toContain('Subtarefa de');
  });

  it('omits completion attribution on an open task', () => {
    const md = formatProcedureTaskDetail({ ...task, completed: false });
    expect(md).not.toContain('Concluída em');
    expect(md).not.toContain('Concluída por');
  });

  // Three tests lived here asserting that `complete`/`uncomplete` sent the
  // right completion payload. They passed while the feature did nothing: they
  // checked what was SENT to the client and never what the server did with it.
  // The public API discards `completed`, so the actions were removed —
  // BUG-13-task-completion-unsupported.test.ts now pins the refusal.

  it('exposes the real priority set, not a sample of it', () => {
    const priority = (procedureTasksTool.inputSchema as any).properties.fields.properties.priority;
    expect(priority.enum).toEqual(['unsure', 'low', 'normal', 'high', 'urgent']);
    expect(priority.description).not.toMatch(/configurado na inst/i);
  });

  it('rejects a priority outside the enum instead of letting it drop', async () => {
    const calls: unknown[] = [];
    const client = { updateProcedureTask: (...a: unknown[]) => { calls.push(a); return Promise.resolve({}); } } as any;
    const res = await executeProcedureTasksTool(
      { action: 'update', id: 3, fields: { priority: 'média' } },
      client
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('urgent');
    expect(calls).toHaveLength(0);
  });
});

describe('REQ-15 — page_size ceiling', () => {
  it('allows the 1000 the API allows, not the 25 the schema claimed', () => {
    expect(HUDU_MAX_PAGE_SIZE).toBe(1000);
    expect(paginationProperties.page_size.maximum).toBe(1000);
    expect(paginationProperties.page_size.default).toBe(25);
  });

  it('no longer tells the model that 25 is the API limit', () => {
    expect(paginationProperties.page_size.description).not.toMatch(/máximo:? 25/i);
    expect(paginationProperties.page_size.description).toMatch(/1000/);
  });
});
