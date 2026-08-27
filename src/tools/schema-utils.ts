// Utility functions for converting common patterns to JSON Schema

export const createActionSchema = (actions: string[], description?: string) => ({
  type: 'string' as const,
  enum: actions,
  description: description || 'Action to perform'
});

export const createFieldsSchema = (properties: Record<string, any>, required?: string[]) => ({
  type: 'object' as const,
  properties,
  description: 'Dados para operações de criação ou atualização',
  ...(required && required.length > 0 ? { required } : {})
});

/**
 * Pagination bounds.
 *
 * The Hudu API caps page_size at 1000 (`calculate_page_size(max_size: 1000)`),
 * not 25. The schema said 25 and told the model that 25 was the API limit,
 * which is why bulk reads were paginating 40x more than they needed to. The
 * default stays at 25 because a large page is what actually costs context.
 */
export const HUDU_MAX_PAGE_SIZE = 1000;
export const HUDU_DEFAULT_PAGE_SIZE = 25;

export const paginationProperties = {
  page: {
    type: 'number' as const,
    minimum: 1,
    default: 1,
    description:
      'Número da página. Só incremente depois de conferir se a página atual indicou que há mais resultados.'
  },
  page_size: {
    type: 'number' as const,
    minimum: 1,
    maximum: HUDU_MAX_PAGE_SIZE,
    default: HUDU_DEFAULT_PAGE_SIZE,
    description:
      'Resultados por página (padrão 25, máximo 1000 na API do Hudu). Mantenha no padrão salvo se o usuário pediu mais ou você já sabe que o conjunto é pequeno — páginas grandes consomem contexto rapidamente.'
  }
};

/**
 * Date filters accepted by most Hudu API index endpoints. A single value
 * matches that date; two values separated by a comma form a range.
 */
const DATE_FILTER_HINT =
  'formato ISO 8601 (AAAA-MM-DD). Intervalo = duas datas por vírgula, e o FIM É EXCLUSIVO: ' +
  'para cobrir até 31/01 escreva "2026-01-01,2026-02-01"; "2026-01-01,2026-01-31" descarta o dia 31 inteiro, ' +
  'e "2026-01-31,2026-01-31" devolve zero. Data inválida é IGNORADA pela API e devolve tudo como se ' +
  'não houvesse filtro — confira a contagem. Com barra, estes filtros usam MM/DD/AAAA, ordem OPOSTA à do ' +
  'campo due_date de tarefas; prefira sempre AAAA-MM-DD para não depender disso.';

export const dateFilterProperties = {
  created_at: {
    type: 'string' as const,
    description: `Filtro por data de criação, ${DATE_FILTER_HINT}`
  },
  updated_at: {
    type: 'string' as const,
    description: `Filtro por data de atualização, ${DATE_FILTER_HINT}`
  }
};

/**
 * Progressive field disclosure: rows ship trimmed and the caller opts into
 * extra attribute groups. Keeps list responses cheap by default without
 * hiding the data behind a second round trip.
 */
export const createIncludeSchema = (groups: string[], description: string) => ({
  type: 'array' as const,
  items: { type: 'string' as const, enum: groups },
  description
});

/** Narrows a caller-supplied include list to the groups a tool actually knows. */
export function resolveIncludeGroups(requested: unknown, allowed: readonly string[]): string[] {
  if (!requested) return [];
  const list = Array.isArray(requested) ? requested : [requested];
  return list.map((g) => String(g)).filter((g) => allowed.includes(g));
}

/**
 * Projects a record down to the base fields plus whichever groups were asked
 * for. Unknown fields are dropped, so the trimmed shape is the contract.
 */
export function projectRecord<T extends Record<string, any>>(
  record: T,
  baseFields: readonly string[],
  groups: Record<string, readonly string[]>,
  includeGroups: readonly string[]
): Record<string, any> {
  const fields = new Set<string>(baseFields);
  for (const group of includeGroups) {
    for (const field of groups[group] ?? []) fields.add(field);
  }
  const out: Record<string, any> = {};
  for (const field of fields) {
    if (record[field] !== undefined) out[field] = record[field];
  }
  return out;
}

export const createQuerySchema = (properties: Record<string, any>) => ({
  type: 'object' as const,
  properties: {
    search: {
      type: 'string',
      description:
        'Termo-CHAVE da busca — use APENAS o nome próprio do recurso/sistema/ativo ' +
        '(ex: "Sankhya", "Oracle", "Firewall"), NÃO a frase completa do usuário. ' +
        'Para filtrar por empresa use o parâmetro company_id ' +
        '(descubra o ID via search_company_information). ' +
        'NÃO inclua verbos de intenção (preciso, quero, buscar) nem substantivos ' +
        'genéricos (senha, acesso, banco de dados) no termo.'
    },
    name: { type: 'string', description: 'Filtrar por nome exato ou parcial' },
    page: { type: 'number', minimum: 1, default: 1, description: 'Número da página para paginação' },
    page_size: paginationProperties.page_size,
    ...properties
  }
});

export const standardActions = ['create', 'get', 'update', 'delete', 'archive', 'unarchive'];
export const basicActions = ['create', 'get', 'update', 'delete'];

/**
 * Builds the `id` parameter description from the tool's OWN action list.
 *
 * The shared literal used to name "get, update, delete ou archive" for every
 * tool that reused it. 17 of the 21 had no `archive`, and three had barely any
 * of them — `hudu_manage_dashboard_widgets` offers only create and delete while
 * promising four operations. A parameter description is read by the model as
 * the contract, so it was teaching actions that do not exist.
 *
 * Deriving the text from the enum makes the drift unrepresentable rather than
 * merely fixed once. `idDescriptionMatchesActions` in the schema-drift test
 * keeps new tools honest.
 */
export const ID_ACTION_VERBS: Record<string, string> = {
  get: 'obter',
  update: 'atualizar',
  delete: 'excluir',
  archive: 'arquivar',
  unarchive: 'desarquivar',
  kickoff: 'iniciar execução',
  duplicate: 'duplicar',
  create_from_template: 'criar a partir de template',
  apply: 'aplicar',
  remove: 'remover',
  flag: 'sinalizar',
  unflag: 'retirar sinalização',
  complete: 'concluir',
  uncomplete: 'reabrir'
};

/** Actions that operate on an existing record, i.e. the ones that need `id`. */
export function idTargetedActions(actions: readonly string[]): string[] {
  return actions.filter((a) => a !== 'create' && ID_ACTION_VERBS[a] !== undefined);
}

export const idForActions = (actions: readonly string[]) => {
  const targeted = idTargetedActions(actions);
  const lista = targeted.map((a) => `${ID_ACTION_VERBS[a]} (${a})`).join(', ');
  return {
    type: 'number' as const,
    description: targeted.length
      ? `ID do recurso. Necessário para: ${lista}.`
      : 'ID do recurso existente sobre o qual a ação atua.'
  };
};

export const commonProperties = {
  id: {
    type: 'number' as const,
    // Generic on purpose: any tool still using this one has not declared which
    // actions it supports, so naming operations here would be a guess.
    description: 'ID do recurso, quando a ação selecionada opera sobre um registro existente'
  },
  company_id: { type: 'number' as const, description: 'ID da empresa associada' },
  folder_id: { type: 'number' as const, description: 'ID da pasta de organização' },
  name: { type: 'string' as const, description: 'Nome do recurso' },
  description: { type: 'string' as const, description: 'Descrição detalhada do recurso' }
};

export const createStandardToolSchema = (actions: string[]) => ({
  type: 'object' as const,
  properties: {
    action: createActionSchema(actions),
    id: idForActions(actions),
    fields: createFieldsSchema({})
  },
  required: ['action']
});