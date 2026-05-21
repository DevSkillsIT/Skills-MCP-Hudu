import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import type { HuduClient } from '../hudu-client.js';

// Navigation operations tool.
//
// IMPORTANT — architectural note:
// The legacy Hudu endpoints /cards/jump, /cards/lookup and /companies/jump
// are integration deep-links (they expect `integration_slug` / `integration_type`
// from external systems like Syncro or ConnectWise). They are NOT name-based
// search endpoints. Previous implementations sent `{name}` and produced HTTP
// 500 / 404. This tool now delegates to the real search endpoints
// (/companies?name= and /assets?name=) while preserving the original action
// enum so existing prompts/agents keep working.
export const navigationTool: Tool = {
  name: 'hudu_navigate_to_resource_by_name',
  description: 'Navegação rápida por nome de registros, fichas e empresas no Hudu — localiza a ficha ou empresa correspondente ao nome informado. Use quando precisar saltar para um recurso específico no Hudu sem ter o ID em mãos. Aceita action (card_jump, card_lookup, company_jump). Internamente usa os endpoints de busca do Hudu para retornar URL e metadados. Retorna Markdown com os registros encontrados.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['card_jump', 'card_lookup', 'company_jump'],
        description: 'Ação de navegação. Valores: card_jump (melhor correspondência entre ativos e artigos, retorna 1 registro), card_lookup (lista completa de ativos e artigos que correspondem ao nome), company_jump (busca a empresa pelo nome e retorna os detalhes)'
      },
      name: { type: 'string', description: 'Nome do recurso ou empresa a localizar' },
      company_id: { type: 'number', description: 'ID da empresa para restringir a busca (opcional, ignorado em company_jump)' }
    },
    required: ['action', 'name']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true
  }
};

// Combine a normalized record used by the formatter layer.
interface NavigationHit {
  id: number;
  name: string;
  type: 'Company' | 'Asset' | 'Article';
  company_id?: number;
  company_name?: string;
  url?: string;
}

function mapCompanyHit(c: any): NavigationHit {
  return {
    id: c.id,
    name: c.name,
    type: 'Company',
    company_id: c.id,
    company_name: c.name,
    url: c.full_url || c.url,
  };
}

function mapAssetHit(a: any): NavigationHit {
  return {
    id: a.id,
    name: a.name,
    type: 'Asset',
    company_id: a.company_id,
    company_name: a.company_name,
    url: a.url,
  };
}

function mapArticleHit(a: any): NavigationHit {
  return {
    id: a.id,
    name: a.name,
    type: 'Article',
    company_id: a.company_id,
    url: a.url,
  };
}

// Tool execution function
export async function executeNavigationTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, name, company_id } = args;

  if (!name) {
    return createErrorResponse('O parâmetro "name" é obrigatório para operações de navegação.');
  }

  try {
    switch (action) {
      case 'company_jump': {
        // Hudu /companies accepts `name` as an exact-ish match and `search`
        // as fuzzy — try both so partial names still resolve.
        const [byName, bySearch] = await Promise.all([
          client.getCompanies({ name, page_size: 25 }).catch(() => []),
          client.getCompanies({ search: name, page_size: 25 }).catch(() => []),
        ]);
        const seen = new Set<number>();
        const hits: NavigationHit[] = [];
        for (const c of [...(byName ?? []), ...(bySearch ?? [])]) {
          if (!seen.has(c.id)) { seen.add(c.id); hits.push(mapCompanyHit(c)); }
        }
        return createSuccessResponse({ action, query: name, results: hits });
      }

      case 'card_lookup': {
        // Broad lookup: fuzzy search both assets and articles in parallel.
        const [assetsByName, assetsBySearch, articlesByName, articlesBySearch] = await Promise.all([
          client.getAssets({ name, company_id, page_size: 25 }).catch(() => []),
          client.getAssets({ search: name, company_id, page_size: 25 }).catch(() => []),
          client.getArticles({ name, company_id, page_size: 25 }).catch(() => []),
          client.getArticles({ search: name, company_id, page_size: 25 }).catch(() => []),
        ]);
        const seen = new Set<string>();
        const hits: NavigationHit[] = [];
        for (const a of [...(assetsByName ?? []), ...(assetsBySearch ?? [])]) {
          const k = `A:${a.id}`;
          if (!seen.has(k)) { seen.add(k); hits.push(mapAssetHit(a)); }
        }
        for (const ar of [...(articlesByName ?? []), ...(articlesBySearch ?? [])]) {
          const k = `R:${ar.id}`;
          if (!seen.has(k)) { seen.add(k); hits.push(mapArticleHit(ar)); }
        }
        return createSuccessResponse({ action, query: name, results: hits });
      }

      case 'card_jump': {
        // Targeted jump: fuzzy search assets first, then articles; return best match.
        const [byName, bySearch] = await Promise.all([
          client.getAssets({ name, company_id, page_size: 5 }).catch(() => []),
          client.getAssets({ search: name, company_id, page_size: 5 }).catch(() => []),
        ]);
        let hits: NavigationHit[] = [...(byName ?? []), ...(bySearch ?? [])].map(mapAssetHit);
        if (hits.length === 0) {
          const [artName, artSearch] = await Promise.all([
            client.getArticles({ name, company_id, page_size: 5 }).catch(() => []),
            client.getArticles({ search: name, company_id, page_size: 5 }).catch(() => []),
          ]);
          hits = [...(artName ?? []), ...(artSearch ?? [])].map(mapArticleHit);
        }
        // card_jump semantics: return only the top match (if any).
        const top = hits.slice(0, 1);
        return createSuccessResponse({ action, query: name, results: top });
      }

      default:
        return createErrorResponse(`Unknown navigation action: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Navigation operation failed: ${error.message}`);
  }
}