import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';
import { HUDU_PROMPTS_LIST, getHuduPromptText, validatePromptArgs } from '../prompts.js';

// List prompts tool - exposes MCP prompts as a tool for MCPHub bridge
export const listPromptsTool: Tool = {
  name: 'hudu_list_prompts',
  description: 'Prompts e modelos prontos no Hudu — catálogo de 15 templates de relatório para gestores e analistas de suporte MSP. Use quando precisar descobrir quais auditorias, inventários e análises o Hudu já traz prontos, antes de executar um com hudu_get_prompt. Consulta somente leitura. Retorna nome, descrição, argumentos e categoria de cada prompt.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  }
};

// Get/execute prompt tool
export const getPromptTool: Tool = {
  name: 'hudu_get_prompt',
  description: 'Prompt, relatório ou checklist do Hudu — executa um template do catálogo com os argumentos informados. Use quando precisar gerar auditoria de segurança, dashboard executivo, inventário ou onboarding de cliente no Hudu; descubra os nomes válidos em hudu_list_prompts. Retorna o resultado do prompt formatado em Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome do prompt a executar',
        enum: HUDU_PROMPTS_LIST.map(p => p.name)
      },
      arguments: {
        type: 'object',
        description: 'Argumentos do prompt (varia por prompt — use hudu_list_prompts para ver detalhes de cada um)'
      }
    },
    required: ['name']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

export async function executeListPromptsTool(_args: any, _client: HuduClient): Promise<ToolResponse> {
  const promptList = HUDU_PROMPTS_LIST.map(p => ({
    name: p.name,
    description: p.description,
    arguments: p.arguments.map(a => ({
      name: a.name,
      description: a.description,
      required: a.required
    }))
  }));

  // Format as Markdown table
  const lines = [
    `**${promptList.length} prompts disponíveis**`,
    '',
    '| Nome | Descrição | Argumentos |',
    '|---|---|---|',
    ...promptList.map(p => {
      const args = p.arguments.map(a => `${a.name}${a.required ? ' (obrig.)' : ''}`).join(', ') || 'nenhum';
      return `| ${p.name} | ${p.description} | ${args} |`;
    })
  ];

  return createSuccessResponse(lines.join('\n'));
}

export async function executeGetPromptTool(args: any, _client: HuduClient): Promise<ToolResponse> {
  const { name, arguments: promptArgs } = args;

  if (!name) {
    return createErrorResponse('Nome do prompt é obrigatório. Use hudu_list_prompts para ver os disponíveis.');
  }

  const prompt = HUDU_PROMPTS_LIST.find(p => p.name === name);
  if (!prompt) {
    return createErrorResponse(`Prompt "${name}" não encontrado. Use hudu_list_prompts para ver os disponíveis.`);
  }

  // REQ-01 / BUG-01: validate required args BEFORE interpolation so the
  // bridge-tool path cannot leak literal `undefined` into the prompt body.
  const validationError = validatePromptArgs(name, promptArgs as Record<string, string>);
  if (validationError) {
    const missing = validationError.required.filter(r => !validationError.provided.includes(r));
    return createErrorResponse(
      `Argumento(s) obrigatório(s) ausente(s) para o prompt "${name}": ${missing.join(', ')}. ` +
      `Informe ${missing.map(m => `"${m}"`).join(', ')} em "arguments".`
    );
  }

  try {
    const result = getHuduPromptText(name, promptArgs || {});
    if (!result) {
      return createErrorResponse(`Prompt "${name}" não retornou conteúdo.`);
    }

    // getHuduPromptText returns { messages: [{ role, content: { type, text } }] }
    if (result.messages && Array.isArray(result.messages)) {
      const text = result.messages.map((m: any) => m.content?.text || '').join('\n\n');
      return createSuccessResponse(text);
    }

    return createSuccessResponse(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } catch (error: any) {
    return createErrorResponse(`Erro ao executar prompt "${name}": ${error.message}`);
  }
}
