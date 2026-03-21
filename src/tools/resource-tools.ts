import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';
import { listResources, readResource } from '../resources.js';

// List resources tool - exposes MCP resources as a tool for MCPHub bridge
export const listResourcesTool: Tool = {
  name: 'hudu_list_resources',
  description: 'Recursos MCP disponiveis no Hudu — catalogo de URIs hudu:// para acesso direto a empresas, ativos e artigos. Use quando precisar descobrir quais recursos de leitura direta estao disponiveis no Hudu. Retorna lista de URIs com nome e descricao de cada recurso.',
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

// Read resource tool
export const readResourceTool: Tool = {
  name: 'hudu_read_resource',
  description: 'Leitura direta de recurso MCP no Hudu — acessa empresas, ativos ou artigos via URI hudu://. Use quando precisar ler dados do Hudu sem filtros, obtendo uma lista completa ou detalhe por ID. Retorna conteudo formatado em Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        description: 'URI do recurso no formato hudu://. Valores validos: hudu://companies, hudu://companies/{id}, hudu://assets, hudu://assets/{id}, hudu://articles, hudu://articles/{id}',
        enum: [
          'hudu://companies',
          'hudu://assets',
          'hudu://articles'
        ]
      },
      id: {
        type: 'number',
        description: 'ID do recurso especifico (opcional). Quando informado, concatena com a URI base: hudu://companies + id=42 -> hudu://companies/42'
      }
    },
    required: ['uri']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

export async function executeListResourcesTool(_args: any, _client: HuduClient): Promise<ToolResponse> {
  const resources = listResources();

  const lines = [
    `**${resources.length} recursos disponiveis**`,
    '',
    '| URI | Nome | Descricao | Formato |',
    '|---|---|---|---|',
    ...resources.map(r =>
      `| ${r.uri} | ${r.name} | ${r.description} | ${r.mimeType} |`
    )
  ];

  return createSuccessResponse(lines.join('\n'));
}

export async function executeReadResourceTool(args: any, client: HuduClient): Promise<ToolResponse> {
  let { uri, id } = args;

  if (!uri) {
    return createErrorResponse('URI do recurso e obrigatoria. Use hudu_list_resources para ver os disponiveis.');
  }

  // Append ID if provided separately
  if (id !== undefined && id !== null) {
    uri = `${uri}/${id}`;
  }

  try {
    const result = await readResource(uri, client);
    return createSuccessResponse(result.text);
  } catch (error: any) {
    return createErrorResponse(`Erro ao ler recurso "${uri}": ${error.message}`);
  }
}
