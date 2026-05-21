/**
 * query-normalizer.ts
 *
 * Self-contained query normalisation utility for MCP search tools.
 * NO Hudu-specific imports — this module can be copied verbatim to GLPI,
 * WHM, Veeam, Sankhya or any other MCP server in this monorepo.
 *
 * Problem it solves:
 *   Users give natural-language queries such as
 *   "preciso da senha do banco de dados do Sankhya na Oracle da Acme".
 *   The LLM forwards the whole phrase to the `search` field. Hudu (and
 *   other systems) index short, specific names ("Sankhya", "Oracle-PROD"),
 *   so the literal phrase matches nothing.
 *
 *   This module:
 *     1. Strips PT-BR function words and intent verbs from the query.
 *     2. Extracts the significant tokens for use in a token-by-token fallback.
 *     3. Provides a predicate to detect whether a tool name is a search tool.
 *
 * Design decisions:
 *   - Only stopwords that are unambiguously noise are stripped (articles,
 *     prepositions, conjunctions, intent verbs).
 *   - Generic nouns ("senha", "banco", "dados", "acesso") are INTENTIONALLY
 *     kept: a user might search for a record literally named "senha" or
 *     "banco de dados", and stripping those words would break that use-case.
 *   - If stripping everything would produce an empty string, the original
 *     trimmed input is returned unchanged (safe fallback).
 */

// ---------------------------------------------------------------------------
// Stopword list — PT-BR function words + intent verbs only.
//
// Rationale for each group:
//   Articles/prep/conj: semantically empty in Hudu index context.
//   Intent verbs: user's intent, never part of a record name.
//
// NOT included: generic nouns (senha, banco, dados, acesso, sistema, etc.)
// Stripping those would prevent legitimate searches for records with such
// names in their titles.
// ---------------------------------------------------------------------------

export const STOPWORDS_PT: Set<string> = new Set([
  // Articles
  'a', 'o', 'as', 'os', 'um', 'uma',
  // Prepositions (simple + contracted)
  'de', 'da', 'do', 'das', 'dos',
  'em', 'na', 'no', 'nas', 'nos',
  'para', 'pra', 'com', 'por',
  // Conjunctions
  'e', 'que',
  // Intent verbs — words that express what the user wants, not what to find
  'preciso', 'quero', 'queria', 'gostaria',
  'busca', 'buscar',
  'procura', 'procurar',
  'achar', 'encontrar',
  'ver', 'mostrar',
  'listar', 'liste',
  'traga', 'trazer',
  'pegar', 'obter',
]);

// ---------------------------------------------------------------------------
// normalizeSearchTerm
//
// Lowercases each token only for the stopword comparison; the original
// capitalisation is preserved in the output.
// Returns '' for empty/undefined input.
// Returns original trimmed string if all tokens are stripped (never empty
// when input was non-empty).
// ---------------------------------------------------------------------------

export function normalizeSearchTerm(raw?: string): string {
  if (!raw || raw.trim() === '') return '';

  const trimmed = raw.trim();
  const tokens = trimmed.split(/\s+/);

  const kept = tokens.filter(
    (tok) => tok.length >= 2 && !STOPWORDS_PT.has(tok.toLowerCase())
  );

  if (kept.length === 0) {
    // Safe fallback: return the original rather than an empty string.
    return trimmed;
  }

  return kept.join(' ');
}

// ---------------------------------------------------------------------------
// searchTokens
//
// Returns the significant tokens from the query, deduplicated and ordered
// longest-first (most specific/unique tokens tried first in the fallback).
// Capped at 4 tokens to avoid excessive API calls.
// ---------------------------------------------------------------------------

const MAX_FALLBACK_TOKENS = 4;

export function searchTokens(raw?: string): string[] {
  if (!raw || raw.trim() === '') return [];

  const tokens = raw.trim().split(/\s+/);

  // Apply same stopword filter + length filter as normaliseSearchTerm
  const significant = tokens.filter(
    (tok) => tok.length >= 2 && !STOPWORDS_PT.has(tok.toLowerCase())
  );

  // Deduplicate (case-insensitive, keep first occurrence with original casing)
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const tok of significant) {
    const lower = tok.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(tok);
    }
  }

  // Order by length descending (longest = most specific = tried first)
  deduped.sort((a, b) => b.length - a.length);

  return deduped.slice(0, MAX_FALLBACK_TOKENS);
}

// ---------------------------------------------------------------------------
// isSearchToolName
//
// Returns true for tool names that go through the search dispatch path.
// Used by the server to decide whether to apply normalisation + fallback.
// ---------------------------------------------------------------------------

export function isSearchToolName(name: string): boolean {
  if (!name) return false;
  // Tools are namespaced with a `hudu_` prefix; accept both the prefixed and
  // the bare form so the helper stays portable across MCPs.
  const bare = name.startsWith('hudu_') ? name.slice('hudu_'.length) : name;
  return bare.startsWith('search_') || bare === 'navigate_to_resource_by_name';
}
