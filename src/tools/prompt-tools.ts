import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';
import { HUDU_PROMPTS_LIST, getHuduPromptText } from '../prompts.js';

// List prompts tool - exposes MCP prompts as a tool for MCPHub bridge
export const listPromptsTool: Tool = {
  name: 'hudu_list_prompts',
  description: 'Prompts e modelos prontos no Hudu — catalogo de 15 templates para gestores e analistas de suporte MSP. Use quando precisar descobrir quais relatorios, auditorias e analises estao disponiveis no Hudu. Retorna nome, descricao, argumentos e categoria de cada prompt disponivel.',
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
  description: 'Prompt e execucao de modelo no Hudu — processa um relatorio ou analise especifica com argumentos customizados. Use quando precisar gerar relatorio de auditoria, compliance, inventario ou checklist no Hudu. Retorna resultado formatado em Markdown.',
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
    `**${promptList.length} prompts disponiveis**`,
    '',
    '| Nome | Descricao | Argumentos |',
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
    return createErrorResponse('Nome do prompt e obrigatorio. Use hudu_list_prompts para ver os disponiveis.');
  }

  const prompt = HUDU_PROMPTS_LIST.find(p => p.name === name);
  if (!prompt) {
    return createErrorResponse(`Prompt "${name}" nao encontrado. Use hudu_list_prompts para ver os disponiveis.`);
  }

  try {
    const result = getHuduPromptText(name, promptArgs || {});
    if (!result) {
      return createErrorResponse(`Prompt "${name}" nao retornou conteudo.`);
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
