import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  createErrorResponse,
  createSuccessResponse,
  createWarnedResponse,
  type ToolResponse
} from './base.js';
import { guardedWrite, describeGuardedWrite } from '../utils/guarded-write.js';
// create has no "before" to compare against, so the echo check is the right
// tool there: it compares what was sent with what the API answered.
import { diffRequestedVsStored, describeEchoDivergence } from '../utils/echo-check.js';
import {
  createActionSchema,
  createFieldsSchema,
  createQuerySchema,
  commonProperties,
  dateFilterProperties,
  idForActions
} from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Extended actions for procedures
const procedureActions = ['create', 'get', 'update', 'delete', 'kickoff', 'duplicate', 'create_from_template'];

export const proceduresTool: Tool = {
  name: 'hudu_manage_workflow_procedures',
  description: 'Procedimentos, rotinas e checklists operacionais no Hudu — CRUD avançado com execução e duplicação. Use quando precisar criar, editar, iniciar ou duplicar fluxos de trabalho e runbooks no Hudu. Aceita action (create, get, update, delete, kickoff, duplicate, create_from_template). Retorna Markdown do procedimento.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(procedureActions, 'Ação a executar. Valores: create (criar novo procedimento), get (obter por ID com as tarefas), update (atualizar por ID), delete (excluir por ID), kickoff (iniciar uma execução a partir do processo — informe fields.name para nomeá-la), duplicate (copiar um processo de empresa), create_from_template (criar a partir de um template global)'),
      id: idForActions(procedureActions),
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome do procedimento. Obrigatório na criação; em kickoff, duplicate e create_from_template nomeia o registro gerado — sem ele o Hudu repete o nome de origem.' },
        description: commonProperties.description,
        company_id: commonProperties.company_id,
        folder_id: commonProperties.folder_id,
        asset_id: { type: 'number', description: 'Ativo associado à execução. Usado apenas em kickoff.' },
        company_template: { type: 'boolean', description: 'Se true, cria o procedimento como template reutilizável para outras empresas' }
      }, ['name'])
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// Procedures query tool
export const proceduresQueryTool: Tool = {
  name: 'hudu_search_workflow_procedures',
  description: 'Procedimentos, processos, execuções e checklists no Hudu — busca com paginação e status de andamento. Use quando precisar localizar runbooks ou acompanhar execuções em curso. Passe type="process" para modelos e type="run" para execuções: sem esse filtro o Hudu devolve os dois misturados. Consulta somente leitura. Retorna tabela Markdown com progresso e status.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id,
    type: {
      type: 'string',
      enum: ['process', 'run'],
      description:
        'Separa modelo de execução. "process" = o procedimento definido (template ou processo da empresa); "run" = uma execução iniciada a partir dele, com progresso próprio. Omitir traz os dois misturados.'
    },
    process_scope: {
      type: 'string',
      enum: ['global', 'company'],
      description:
        'Só faz sentido com type="process". "global" = templates reutilizáveis sem empresa; "company" = processos de uma empresa específica.'
    },
    parent_process_id: {
      type: 'number',
      description: 'Lista as execuções iniciadas a partir deste processo. Implica type="run".'
    },
    slug: { type: 'string', description: 'Filtrar pelo slug do procedimento' },
    // `search` and `name` are both resolved locally here — see
    // executeProceduresQueryTool for why neither works server-side.
    archived: {
      type: 'boolean',
      description: 'true traz apenas arquivados; false apenas ativos. Omitir traz apenas ativos.'
    },
    ...dateFilterProperties
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Procedure tasks tool
const taskActions = ['create', 'get', 'update', 'delete'];

/**
 * Fields the Hudu public REST API silently discards on procedure tasks.
 *
 * `Api::V1::ProcedureTasksController#update` calls
 * `@procedure_task.update!(procedure_task_params)`, and that strong-params
 * `permit` lists only name, description, procedure_id, position, due_date,
 * priority, optional, parent_task_id and assigned_users[]. Anything else is
 * dropped by Rails; `update!` then succeeds having changed nothing, which is
 * indistinguishable from success unless you read the record back.
 *
 * Marking a task done is therefore NOT possible over the public API. The
 * official in-product MCP can do it (RunTaskCompleteTool) because it goes
 * through ActiveRecord and never meets strong params.
 */
export const API_UNWRITABLE_TASK_FIELDS = ['completed', 'completion_notes'] as const;

/**
 * Closed set, from `ProcedureTask`: `enum :priority, [:unsure, :low, :normal,
 * :high, :urgent]`. The schema used to call this "conforme configurado na
 * instância" and give three of the five as examples, so `urgent` and `unsure`
 * were unreachable and a plausible guess like "média" was a silent drop —
 * the same defect BUG-12 fixed for flag colours.
 */
const TASK_PRIORITIES: string[] = ['unsure', 'low', 'normal', 'high', 'urgent'];

/**
 * Date formats `due_date` actually accepts, confirmed live:
 *   2026-12-31 -> grava 2026-12-31
 *   31/12/2026 -> grava 2026-12-31   (DD/MM)
 *   12/31/2026 -> 200 e APAGA o prazo (MM/DD nao e aceito aqui)
 *
 * Note the trap: the date FILTERS (`created_at`, `updated_at`) use MM/DD with
 * slashes — the opposite order, in the same MCP. Rejecting an unparseable value
 * here is what stops a typo from wiping a deadline.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Converts an accepted date to the form the server stores.
 *
 * The API takes DD/MM/AAAA and normalises it to ISO, so echoing the request
 * back against the response reported every Brazilian-format write as "a API
 * respondeu sucesso mas NÃO gravou" — an alarm on a write that worked
 * perfectly, with a suggested cause that was also wrong. Normalising before
 * sending makes the request and the stored value the same string.
 */
function normalizeDueDate(value: unknown): string {
  const s = String(value);
  const br = BR_DATE.exec(s);
  if (!br) return s;
  const [, d, m, y] = br;
  return `${y}-${m}-${d}`;
}

function invalidDueDate(value: unknown): string | null {
  const s = String(value);
  if (ISO_DATE.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d!));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m! - 1 && dt.getUTCDate() === d) return null;
  }
  const br = BR_DATE.exec(s);
  if (br) {
    const [, d, m, y] = br.map(Number) as [number, number, number, number];
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) return null;
  }
  return (
    `due_date inválido: "${value}". Use AAAA-MM-DD (ex: 2026-12-31) ou DD/MM/AAAA (ex: 31/12/2026). ` +
    'Enviar outro formato faz a API responder sucesso e APAGAR o prazo que já estava gravado. ' +
    'Cuidado: os filtros created_at/updated_at usam a ordem oposta (MM/DD) quando escritos com barra.'
  );
}

const TASK_COMPLETION_UNSUPPORTED =
  'A API pública do Hudu não permite concluir nem reabrir tarefas: o endpoint ' +
  'PUT /procedure_tasks/{id} descarta os campos completed e completion_notes, ' +
  'e responde sucesso sem ter alterado nada. Conclua a tarefa pela interface web ' +
  'do Hudu ou pelo MCP oficial embutido no produto, que acessa o modelo direto. ' +
  'Pelo MCP continuam funcionando: criar, renomear, reposicionar, excluir tarefa, ' +
  'e alterar due_date, priority, optional, parent_task_id e assigned_users.';

export const procedureTasksTool: Tool = {
  name: 'hudu_manage_procedure_task_items',
  description: 'Tarefas, etapas e passos de procedimentos no Hudu — cria, edita e exclui itens de checklist, com prazo, prioridade, responsáveis e subtarefas. Use quando precisar montar ou reordenar as etapas de um processo do Hudu. NÃO conclui tarefa: a API pública descarta o campo completed, então conclusão só pela interface web. Aceita action (create, get, update, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(taskActions, 'Ação a executar. Valores: create (criar nova tarefa), get (obter por ID), update (atualizar por ID), delete (excluir por ID). Concluir ou reabrir tarefa não está disponível: a API pública do Hudu não aceita esse campo.'),
      id: idForActions(taskActions),
      procedure_id: { type: 'number', description: 'ID do procedimento para listar tarefas' },
      fields: createFieldsSchema({
        name: { type: 'string', description: 'Nome da tarefa (obrigatório para criação)' },
        description: commonProperties.description,
        position: { type: 'number', description: 'Posição da tarefa dentro do procedimento' },
        procedure_id: { type: 'number', description: 'ID do procedimento pai (obrigatório para criação)' },
        due_date: { type: 'string', description: 'Prazo da tarefa, formato ISO 8601 (AAAA-MM-DD)' },
        priority: {
          type: 'string',
          enum: TASK_PRIORITIES,
          description: `Prioridade da tarefa. Conjunto fechado no Hudu: ${TASK_PRIORITIES.join(', ')}.`
        },
        optional: { type: 'boolean', description: 'Se true, a tarefa não bloqueia a conclusão do processo' },
        assigned_users: { type: 'array', items: { type: 'number' }, description: 'IDs dos usuários responsáveis pela tarefa' },
        parent_task_id: { type: 'number', description: 'ID da tarefa pai, para criar uma subtarefa' }
      }, ['name', 'procedure_id'])
    },
    required: ['action']
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true
  }
};

// Procedure tasks query tool
export const procedureTasksQueryTool: Tool = {
  name: 'hudu_search_procedure_task_items',
  description: 'Tarefas, etapas e passos dentro de procedimentos no Hudu — busca e filtragem com paginação. Use quando precisar listar itens de um checklist ou fluxo de trabalho específico no Hudu. Filtra por procedure_id. Consulta somente leitura. Retorna lista paginada em Markdown com dados das tarefas encontradas.',
  inputSchema: createQuerySchema({
    procedure_id: { type: 'number', description: 'Filtrar por ID do procedimento ou da execução' },
    ...dateFilterProperties
  }),
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Tool execution functions
export async function executeProceduresTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name) {
          return createErrorResponse('Procedure name is required for creating procedures');
        }
        const newProcedure = await client.createProcedure(fields);
        return createSuccessResponse(newProcedure, 'Procedure created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Procedure ID is required for get operation');
        }
        const procedure = await client.getProcedure(id);
        return createSuccessResponse(procedure);
        
      case 'update': {
        if (!id) {
          return createErrorResponse('Procedure ID is required for update operation');
        }
        const { record: updatedProcedure, report } = await guardedWrite({
          readBefore: () => client.getProcedure(id) as any,
          write: () => client.updateProcedure(id, fields || {}) as any,
          requested: fields || {},
        });
        return createWarnedResponse(
          updatedProcedure,
          describeGuardedWrite(report),
          'Procedure updated successfully'
        );
      }
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Procedure ID is required for delete operation');
        }
        await client.deleteProcedure(id);
        return createSuccessResponse(null, 'Procedure deleted successfully');
        
      case 'kickoff': {
        if (!id) {
          return createErrorResponse('Procedure ID is required for kickoff operation');
        }
        const kickoffResult = await client.kickoffProcedure(id, {
          name: fields?.name,
          asset_id: fields?.asset_id
        });
        return createSuccessResponse(
          kickoffResult,
          'Execução iniciada a partir do processo.'
        );
      }

      case 'duplicate': {
        if (!id) {
          return createErrorResponse('Procedure ID is required for duplicate operation');
        }
        const duplicatedProcedure = await client.duplicateProcedure(id, {
          name: fields?.name,
          description: fields?.description,
          company_id: fields?.company_id
        });
        return createSuccessResponse(duplicatedProcedure, 'Procedimento duplicado.');
      }

      case 'create_from_template': {
        if (!id) {
          return createErrorResponse('Template procedure ID is required for create_from_template operation');
        }
        const procedureFromTemplate = await client.createFromTemplate(id, {
          name: fields?.name,
          description: fields?.description,
          company_id: fields?.company_id
        });
        return createSuccessResponse(
          procedureFromTemplate,
          'Procedimento criado a partir do template global.'
        );
      }
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Procedures operation failed: ${error.message}`);
  }
}

/**
 * `GET /procedures` has no working text search.
 *
 * Confirmed live (2026-08-27), 9 procedures on the instance:
 *   sem filtro        -> 9
 *   search=zzzzzzzz   -> 9      <- the parameter does nothing
 *   name=teste        -> 2
 *   name=test         -> 0      <- exact match, not partial
 *
 * So both advertised ways of narrowing were broken, silently and in opposite
 * directions: `search` returned everything as if it were the result, and a
 * partial `name` returned nothing, which reads as "does not exist". The schema
 * promised "nome exato ou parcial".
 *
 * (`/procedure_tasks` differs: there `name` IS partial server-side. Same schema
 * sentence, right in one tool and wrong in the other.)
 *
 * Filtering here is the only place it can happen. Procedures are a small
 * collection, so one wide page and a local substring match is cheap and honest
 * — and the response says the filter was local.
 */
const PROCEDURE_LOCAL_FILTER_PAGE_SIZE = 1000;

function matchesLocally(p: { name?: string; description?: string }, term: string): boolean {
  const t = term.toLowerCase();
  return (p.name ?? '').toLowerCase().includes(t) || (p.description ?? '').toLowerCase().includes(t);
}

export async function executeProceduresQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const { search, name, ...rest } = args ?? {};

    // An unrecognised `type` was ignored by the API, so the whole collection
    // came back looking like the filtered answer.
    for (const [param, valid] of [
      ['type', ['process', 'run']],
      ['process_scope', ['global', 'company']],
    ] as const) {
      const v = (rest as Record<string, unknown>)[param];
      if (v !== undefined && !valid.includes(String(v) as never)) {
        return createErrorResponse(
          `${param} inválido: "${v}". Valores aceitos: ${valid.join(', ')}. ` +
            'Um valor fora dessa lista é ignorado pela API e devolveria a coleção inteira como se fosse o resultado filtrado.'
        );
      }
    }

    const term = (search ?? name ?? '').toString().trim();

    if (!term) {
      return createSuccessResponse(await client.getProcedures(rest));
    }

    // Neither parameter can do this server-side, so ask for a wide page and
    // match here. Sending them anyway would filter to nothing (name) or not at
    // all (search).
    const all = await client.getProcedures({
      ...rest,
      page_size: Math.max(Number(rest.page_size) || 0, PROCEDURE_LOCAL_FILTER_PAGE_SIZE),
    });
    const hits = all.filter((p) => matchesLocally(p, term));

    return createWarnedResponse(
      hits,
      `Filtro por "${term}" aplicado localmente: a API do Hudu ignora o parâmetro search em /procedures e trata name como correspondência exata. ` +
        `Foram lidos ${all.length} procedimentos e ${hits.length} casaram (nome ou descrição, sem diferenciar maiúsculas).`
    );
  } catch (error: any) {
    return createErrorResponse(`Procedures query failed: ${error.message}`);
  }
}

export async function executeProcedureTasksTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args;

  // These guards are about what gets WRITTEN. Running them on get/delete
  // rejected harmless calls with an error about storage, and made the parent
  // lookup fire an extra GET on an action that writes nothing.
  const isWrite = action === 'create' || action === 'update';

  // Rails drops unpermitted keys without complaining, so sending one of these
  // reads as success. Refuse before the request rather than after.
  const dropped = isWrite
    ? API_UNWRITABLE_TASK_FIELDS.filter((f) => fields?.[f] !== undefined)
    : [];
  if (dropped.length > 0) {
    return createErrorResponse(
      `${dropped.join(' e ')} não pode ser gravado pela API pública do Hudu e seria descartado em silêncio. ${TASK_COMPLETION_UNSUPPORTED}`
    );
  }

  if (isWrite && fields?.priority !== undefined && !TASK_PRIORITIES.includes(String(fields.priority))) {
    return createErrorResponse(
      `priority inválida: "${fields.priority}". Valores aceitos: ${TASK_PRIORITIES.join(', ')}`
    );
  }

  if (isWrite && fields?.due_date !== undefined && fields.due_date !== null) {
    const dateError = invalidDueDate(fields.due_date);
    if (dateError) return createErrorResponse(dateError);
    // Send what the server will store, so the echo check compares like with like.
    fields.due_date = normalizeDueDate(fields.due_date);
  }

  // parent_task_id: "xyz" is stored as 0, so the task claims to be a child of
  // task 0 — a parent that cannot exist. Measured live, HTTP 200, no warning.
  if (isWrite && fields?.parent_task_id !== undefined && fields.parent_task_id !== null) {
    // `Number()` and Ruby's `String#to_i` disagree, and the API uses to_i:
    //   '1e3'  -> Number 1000, to_i 1
    //   '0x10' -> Number 16,   to_i 0   <- the very corruption this guards against
    // Validating with Number() and then forwarding the raw string meant the
    // guard checked one value and the server stored another, and the existence
    // check vouched for a task that was never the one written.
    const raw = String(fields.parent_task_id).trim();
    const parentId = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isInteger(parentId) || parentId <= 0) {
      return createErrorResponse(
        `parent_task_id inválido: ${JSON.stringify(fields.parent_task_id)}. Informe o ID inteiro da tarefa pai, só dígitos. ` +
          'Formatos como "1e3" ou "0x10" são lidos pela API como 1 e 0, e a tarefa passaria a apontar para uma tarefa pai inexistente.'
      );
    }
    // Forward the coerced number, never the original string.
    fields.parent_task_id = parentId;
    try {
      const parent = await client.getProcedureTask(parentId);
      if (!parent || (parent as { id?: number }).id === undefined) {
        return createErrorResponse(`parent_task_id ${parentId} não existe. A tarefa ficaria órfã na hierarquia.`);
      }
    } catch {
      return createErrorResponse(
        `Não foi possível confirmar que a tarefa pai ${parentId} existe. Confirme o ID antes de criar a subtarefa.`
      );
    }
  }

  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.procedure_id) {
          return createErrorResponse('Task name and procedure_id are required for creating tasks');
        }
        const newTask = await client.createProcedureTask(fields);
        return createWarnedResponse(
          newTask,
          describeEchoDivergence(diffRequestedVsStored(fields, newTask as any)),
          'Procedure task created successfully'
        );
        
      case 'get':
        if (!id) {
          return createErrorResponse('Task ID is required for get operation');
        }
        const task = await client.getProcedureTask(id);
        return createSuccessResponse(task);
        
      case 'update': {
        if (!id) {
          return createErrorResponse('Task ID is required for update operation');
        }
        // Read before, write, compare everything — not only the fields that
        // were sent. The dangerous case is a field nobody touched coming back
        // empty, which is how a stored deadline disappeared.
        const { record: updatedTask, report } = await guardedWrite({
          readBefore: () => client.getProcedureTask(id) as any,
          write: () => client.updateProcedureTask(id, fields || {}) as any,
          requested: fields || {},
        });
        return createWarnedResponse(
          updatedTask,
          describeGuardedWrite(report),
          'Procedure task updated successfully'
        );
      }
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Task ID is required for delete operation');
        }
        await client.deleteProcedureTask(id);
        return createSuccessResponse(null, 'Procedure task deleted successfully');

      // Kept as recognised actions on purpose. A model asked to "concluir a
      // tarefa" will reach for these names; answering "Unknown action" teaches
      // it nothing, while this says what is impossible and what still works.
      case 'complete':
      case 'uncomplete': {
        // A dead end plus a link is one click; a dead end alone sends someone
        // hunting through the UI for the task they already identified here.
        let deepLink = '';
        if (id) {
          try {
            const task = await client.getProcedureTask(id);
            const url = (task as { url?: string })?.url;
            if (url) deepLink = ` Abra a tarefa direto: ${url}`;
          } catch {
            // The link is a courtesy; never turn its absence into a second error.
          }
        }
        return createErrorResponse(`${TASK_COMPLETION_UNSUPPORTED}${deepLink}`);
      }

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Procedure tasks operation failed: ${error.message}`);
  }
}

export async function executeProcedureTasksQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    // `/procedure_tasks` ignores `search` but DOES honour `name` as a partial,
    // case-insensitive match (verified live: name=Rear matches "Rearm..."), so
    // the fix here is just to route the term to the parameter that works.
    const { search, ...rest } = args ?? {};
    const params = search && !rest.name ? { ...rest, name: search } : rest;
    const tasks = await client.getProcedureTasks(params);
    return createSuccessResponse(tasks);
  } catch (error: any) {
    return createErrorResponse(`Procedure tasks query failed: ${error.message}`);
  }
}