import type { HuduClient } from './hudu-client.js';
import {
  formatCompanyList, formatCompanyDetail,
  formatAssetList, formatAssetDetail,
  formatArticleList, formatArticleDetail,
  toPagedResponse
} from './formatters/markdown.js';

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export function listResources(): McpResource[] {
  return [
    { uri: 'hudu://companies', name: 'Empresas Hudu', description: 'Empresas, clientes e organizacoes cadastradas no Hudu — lista completa com nome, tipo, endereco e status. Recurso somente leitura.', mimeType: 'text/markdown' },
    { uri: 'hudu://companies/{id}', name: 'Empresa Hudu por ID', description: 'Detalhes completos de uma empresa ou cliente especifico no Hudu — endereco, telefone, notas e informacoes cadastrais.', mimeType: 'text/markdown' },
    { uri: 'hudu://assets', name: 'Ativos de TI Hudu', description: 'Ativos, equipamentos e dispositivos de TI cadastrados no Hudu — inventario completo com modelo, serial e campos customizados. Recurso somente leitura.', mimeType: 'text/markdown' },
    { uri: 'hudu://assets/{id}', name: 'Ativo Hudu por ID', description: 'Detalhes completos de um ativo ou equipamento de TI especifico no Hudu — campos customizados, empresa e layout.', mimeType: 'text/markdown' },
    { uri: 'hudu://articles', name: 'Artigos KB Hudu', description: 'Artigos, documentos e procedimentos da base de conhecimento no Hudu — lista com titulo, empresa e status de publicacao. Recurso somente leitura.', mimeType: 'text/markdown' },
    { uri: 'hudu://articles/{id}', name: 'Artigo KB Hudu por ID', description: 'Detalhes completos de um artigo ou documento da base de conhecimento no Hudu — conteudo completo em Markdown.', mimeType: 'text/markdown' },
  ];
}

export async function readResource(uri: string, client: HuduClient): Promise<{ uri: string; mimeType: string; text: string }> {
  const match = uri.match(/^hudu:\/\/(companies|assets|articles)(?:\/(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid Hudu URI format: ${uri}. Valid patterns: hudu://companies, hudu://companies/{id}, hudu://assets, hudu://assets/{id}, hudu://articles, hudu://articles/{id}`);
  }

  const [, resourceType, resourceId] = match;
  let text: string;

  switch (resourceType) {
    case 'companies':
      if (resourceId) {
        const company = await client.getCompany(parseInt(resourceId, 10));
        text = formatCompanyDetail(company);
      } else {
        const companies = await client.getCompanies({ page: 1, page_size: 25 });
        text = formatCompanyList(toPagedResponse(companies));
      }
      break;
    case 'assets':
      if (resourceId) {
        const asset = await client.getAsset(parseInt(resourceId, 10));
        text = formatAssetDetail(asset);
      } else {
        const assets = await client.getAssets({ page: 1, page_size: 25 });
        text = formatAssetList(toPagedResponse(assets));
      }
      break;
    case 'articles':
      if (resourceId) {
        const article = await client.getArticle(parseInt(resourceId, 10));
        text = formatArticleDetail(article);
      } else {
        const articles = await client.getArticles({ page: 1, page_size: 25 });
        text = formatArticleList(toPagedResponse(articles));
      }
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }

  return { uri, mimeType: 'text/markdown', text };
}
