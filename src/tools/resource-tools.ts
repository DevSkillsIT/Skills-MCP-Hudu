import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';
import { listResources, readResource } from '../resources.js';

// List resources tool - exposes MCP resources as a tool for MCPHub bridge
export const listResourcesTool: Tool = {
  name: 'hudu_list_resources',
  description: 'Recursos MCP disponíveis no Hudu — catálogo de URIs hudu:// para leitura direta de empresas, ativos e artigos, sem montar filtros. Use quando precisar descobrir o que o Hudu expõe por URI antes de chamar hudu_read_resource. Consulta somente leitura. Retorna a lista de URIs com nome, descrição e tipo de conteúdo de cada recurso.',
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

// Read resource tool.
// REQ-15 / PRB-04: the uri enum lists only base collection URIs. Detail
// access is provided by the optional `id` parameter, which is concatenated
// to the chosen base uri. Parameterized forms (hudu://companies/{id}) are
// NOT advertised in the enum to keep the schema and description aligned.
export const readResourceTool: Tool = {
  name: 'hudu_read_resource',
  description: 'Recurso MCP do Hudu por URI — lê empresas, ativos ou artigos direto de um endereço hudu://, sem montar filtros de busca. Use quando já souber o URI e precisar da lista completa ou do detalhe por ID; descubra os URIs válidos em hudu_list_resources. Consulta somente leitura no Hudu. Retorna o conteúdo do recurso formatado em Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        description: 'URI base do recurso. Valores válidos: hudu://companies, hudu://assets, hudu://articles. Para obter um item específico, combine com o parâmetro id (ex.: uri=hudu://companies + id=42 → leitura de /companies/42).',
        enum: [
          'hudu://companies',
          'hudu://assets',
          'hudu://articles'
        ]
      },
      id: {
        type: 'number',
        description: 'ID opcional do recurso específico. Quando informado, é concatenado à URI base: hudu://companies + id=42 → hudu://companies/42.'
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
    `**${resources.length} recursos disponíveis**`,
    '',
    '| URI | Nome | Descrição | Formato |',
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
    return createErrorResponse('URI do recurso é obrigatória. Use hudu_list_resources para ver as disponíveis.');
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
