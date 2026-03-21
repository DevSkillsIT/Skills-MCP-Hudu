import type { HuduClient } from './hudu-client.js';
import {
  formatCompanyList,
  formatCompanyDetail,
  formatAssetList,
  formatAssetDetail,
  formatArticleList,
  formatArticleDetail,
  toPagedResponse
} from './formatters/markdown.js';
import { MCP_RESOURCE_TYPES } from './types.js';

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export class InvalidResourceUriError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResourceUriError';
  }
}

// Centraliza os resources expostos no protocolo MCP e reaproveita as URIs
// canonicas definidas em MCP_RESOURCE_TYPES para evitar drift entre list/read.
const RESOURCE_DEFINITIONS = [
  {
    key: 'companies',
    listUri: MCP_RESOURCE_TYPES.COMPANIES,
    detailUri: MCP_RESOURCE_TYPES.COMPANY_DETAIL,
    name: 'Empresas Hudu',
    detailName: 'Empresa Hudu por ID',
    description:
      'Empresas, clientes e organizacoes cadastradas no Hudu - lista completa com nome, tipo, endereco e status. Recurso somente leitura.',
    detailDescription:
      'Detalhes completos de uma empresa ou cliente especifico no Hudu - endereco, telefone, notas e informacoes cadastrais.'
  },
  {
    key: 'assets',
    listUri: MCP_RESOURCE_TYPES.ASSETS,
    detailUri: MCP_RESOURCE_TYPES.ASSET_DETAIL,
    name: 'Ativos de TI Hudu',
    detailName: 'Ativo Hudu por ID',
    description:
      'Ativos, equipamentos e dispositivos de TI cadastrados no Hudu - inventario completo com modelo, serial e campos customizados. Recurso somente leitura.',
    detailDescription:
      'Detalhes completos de um ativo ou equipamento de TI especifico no Hudu - campos customizados, empresa e layout.'
  },
  {
    key: 'articles',
    listUri: MCP_RESOURCE_TYPES.ARTICLES,
    detailUri: MCP_RESOURCE_TYPES.ARTICLE_DETAIL,
    name: 'Artigos KB Hudu',
    detailName: 'Artigo KB Hudu por ID',
    description:
      'Artigos, documentos e procedimentos da base de conhecimento no Hudu - lista com titulo, empresa e status de publicacao. Recurso somente leitura.',
    detailDescription:
      'Detalhes completos de um artigo ou documento da base de conhecimento no Hudu - conteudo completo em Markdown.'
  }
] as const;

function createMarkdownResource(
  uri: string,
  name: string,
  description: string
): McpResource {
  return {
    uri,
    name,
    description,
    mimeType: 'text/markdown'
  };
}

function buildInvalidUriMessage(uri: string): string {
  return `Invalid Hudu URI format: ${uri}. Valid patterns: ${RESOURCE_DEFINITIONS.map((resource) => `${resource.listUri}, ${resource.detailUri}`).join(', ')}`;
}

function parseResourceUri(uri: string): {
  key: typeof RESOURCE_DEFINITIONS[number]['key'];
  id?: number;
} {
  // Aceita apenas os recursos explicitamente publicados em listResources().
  for (const resource of RESOURCE_DEFINITIONS) {
    if (uri === resource.listUri) {
      return { key: resource.key };
    }

    const detailPrefix = resource.detailUri.replace('{id}', '');
    if (uri.startsWith(detailPrefix)) {
      const idPart = uri.slice(detailPrefix.length);
      if (/^\d+$/.test(idPart)) {
        return { key: resource.key, id: parseInt(idPart, 10) };
      }
    }
  }

  throw new InvalidResourceUriError(buildInvalidUriMessage(uri));
}

export function listResources(): McpResource[] {
  return RESOURCE_DEFINITIONS.flatMap((resource) => [
    createMarkdownResource(resource.listUri, resource.name, resource.description),
    createMarkdownResource(resource.detailUri, resource.detailName, resource.detailDescription)
  ]);
}

export async function readResource(
  uri: string,
  client: HuduClient
): Promise<{ uri: string; mimeType: string; text: string }> {
  const { key: resourceType, id: resourceId } = parseResourceUri(uri);
  let text: string;

  switch (resourceType) {
    case 'companies':
      if (resourceId !== undefined) {
        const company = await client.getCompany(resourceId);
        text = formatCompanyDetail(company);
      } else {
        const companies = await client.getCompanies({ page: 1, page_size: 25 });
        text = formatCompanyList(toPagedResponse(companies));
      }
      break;
    case 'assets':
      if (resourceId !== undefined) {
        // Hudu API: /assets/:id returns 404. Use list with id filter instead.
        const assetResults = await client.getAssets({ id: resourceId } as any);
        const foundAsset = assetResults?.[0];
        if (foundAsset) {
          text = formatAssetDetail(foundAsset);
        } else {
          throw new InvalidResourceUriError(`Asset ID ${resourceId} not found`);
        }
      } else {
        const assets = await client.getAssets({ page: 1, page_size: 25 });
        text = formatAssetList(toPagedResponse(assets));
      }
      break;
    case 'articles':
      if (resourceId !== undefined) {
        const article = await client.getArticle(resourceId);
        text = formatArticleDetail(article);
      } else {
        const articles = await client.getArticles({ page: 1, page_size: 25 });
        text = formatArticleList(toPagedResponse(articles));
      }
      break;
    default:
      throw new InvalidResourceUriError(`Unknown resource type: ${resourceType}`);
  }

  return { uri, mimeType: 'text/markdown', text };
}
