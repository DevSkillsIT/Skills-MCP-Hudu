import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { createActionSchema, createFieldsSchema, createQuerySchema, commonProperties } from './schema-utils.js';
import type { HuduClient } from '../hudu-client.js';

// Extended actions for procedures
const procedureActions = ['create', 'get', 'update', 'delete', 'kickoff', 'duplicate', 'create_from_template'];

export const proceduresTool: Tool = {
  name: 'hudu_manage_workflow_procedures',
  description: 'Procedimentos, rotinas e checklists operacionais no Hudu — CRUD avançado com execução e duplicação. Use quando precisar criar, editar, iniciar ou duplicar fluxos de trabalho e runbooks no Hudu. Aceita action (create, get, update, delete, kickoff, duplicate, create_from_template). Retorna JSON do procedimento.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(procedureActions, 'Ação a executar. Valores: create (criar novo procedimento), get (obter por ID), update (atualizar por ID), delete (excluir por ID), kickoff (iniciar execução do procedimento), duplicate (duplicar procedimento existente), create_from_template (criar novo a partir de um template)'),
      id: commonProperties.id,
      fields: createFieldsSchema({
        name: commonProperties.name,
        description: commonProperties.description,
        company_id: commonProperties.company_id,
        folder_id: commonProperties.folder_id
      })
    },
    required: ['action']
  }
};

// Procedures query tool
export const proceduresQueryTool: Tool = {
  name: 'hudu_search_workflow_procedures',
  description: 'Procedimentos, rotinas e checklists operacionais no Hudu — busca e filtragem com paginação. Use quando precisar localizar fluxos de trabalho ou runbooks por texto ou empresa no Hudu. Consulta somente leitura. Retorna lista paginada em JSON com metadados dos procedimentos encontrados.',
  inputSchema: createQuerySchema({
    company_id: commonProperties.company_id
  })
};

// Procedure tasks tool
const taskActions = ['create', 'get', 'update', 'delete'];

export const procedureTasksTool: Tool = {
  name: 'hudu_manage_procedure_task_items',
  description: 'Tarefas, etapas e passos dentro de procedimentos no Hudu — operações CRUD para itens individuais de checklists. Use quando precisar criar, editar ou excluir etapas de um fluxo de trabalho específico no Hudu. Requer procedure_id. Aceita action (create, get, update, delete). Retorna JSON da tarefa.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(taskActions, 'Ação a executar. Valores: create (criar nova tarefa), get (obter por ID), update (atualizar por ID), delete (excluir por ID)'),
      id: commonProperties.id,
      procedure_id: { type: 'number', description: 'ID do procedimento para listar tarefas' },
      fields: createFieldsSchema({
        name: commonProperties.name,
        description: commonProperties.description,
        position: { type: 'number', description: 'Posição da tarefa dentro do procedimento' },
        completed: { type: 'boolean', description: 'Status de conclusão da tarefa (true = concluída)' },
        procedure_id: { type: 'number', description: 'ID do procedimento pai (obrigatório para criação)' }
      })
    },
    required: ['action']
  }
};

// Procedure tasks query tool
export const procedureTasksQueryTool: Tool = {
  name: 'hudu_search_procedure_task_items',
  description: 'Tarefas, etapas e passos dentro de procedimentos no Hudu — busca e filtragem com paginação. Use quando precisar listar itens de um checklist ou fluxo de trabalho específico no Hudu. Filtra por procedure_id. Consulta somente leitura. Retorna lista paginada em JSON com dados das tarefas encontradas.',
  inputSchema: createQuerySchema({
    procedure_id: { type: 'number', description: 'Filtrar por ID do procedimento' }
  })
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
        
      case 'update':
        if (!id) {
          return createErrorResponse('Procedure ID is required for update operation');
        }
        const updatedProcedure = await client.updateProcedure(id, fields || {});
        return createSuccessResponse(updatedProcedure, 'Procedure updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Procedure ID is required for delete operation');
        }
        await client.deleteProcedure(id);
        return createSuccessResponse(null, 'Procedure deleted successfully');
        
      case 'kickoff':
        if (!id) {
          return createErrorResponse('Procedure ID is required for kickoff operation');
        }
        const kickoffResult = await client.kickoffProcedure(id);
        return createSuccessResponse(kickoffResult, 'Procedure kicked off successfully');
        
      case 'duplicate':
        if (!id) {
          return createErrorResponse('Procedure ID is required for duplicate operation');
        }
        const duplicatedProcedure = await client.duplicateProcedure(id);
        return createSuccessResponse(duplicatedProcedure, 'Procedure duplicated successfully');
        
      case 'create_from_template':
        if (!id) {
          return createErrorResponse('Template procedure ID is required for create_from_template operation');
        }
        const procedureFromTemplate = await client.createFromTemplate(id);
        return createSuccessResponse(procedureFromTemplate, 'Procedure created from template successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Procedures operation failed: ${error.message}`);
  }
}

export async function executeProceduresQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const procedures = await client.getProcedures(args);
    return createSuccessResponse(procedures);
  } catch (error: any) {
    return createErrorResponse(`Procedures query failed: ${error.message}`);
  }
}

export async function executeProcedureTasksTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, procedure_id, fields } = args;
  
  try {
    switch (action) {
      case 'create':
        if (!fields?.name || !fields?.procedure_id) {
          return createErrorResponse('Task name and procedure_id are required for creating tasks');
        }
        const newTask = await client.createProcedureTask(fields);
        return createSuccessResponse(newTask, 'Procedure task created successfully');
        
      case 'get':
        if (!id) {
          return createErrorResponse('Task ID is required for get operation');
        }
        const task = await client.getProcedureTask(id);
        return createSuccessResponse(task);
        
      case 'update':
        if (!id) {
          return createErrorResponse('Task ID is required for update operation');
        }
        const updatedTask = await client.updateProcedureTask(id, fields || {});
        return createSuccessResponse(updatedTask, 'Procedure task updated successfully');
        
      case 'delete':
        if (!id) {
          return createErrorResponse('Task ID is required for delete operation');
        }
        await client.deleteProcedureTask(id);
        return createSuccessResponse(null, 'Procedure task deleted successfully');
        
      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Procedure tasks operation failed: ${error.message}`);
  }
}

export async function executeProcedureTasksQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const tasks = await client.getProcedureTasks(args);
    return createSuccessResponse(tasks);
  } catch (error: any) {
    return createErrorResponse(`Procedure tasks query failed: ${error.message}`);
  }
}