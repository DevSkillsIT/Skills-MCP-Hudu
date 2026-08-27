import type {
  HuduCompany,
  HuduAsset,
  HuduAssetLayout,
  HuduArticle,
  HuduExpiration,
  HuduWebsite,
  HuduActivityLog,
  HuduFolder,
  HuduRelation,
  HuduMagicDash,
  HuduProcedure,
  HuduNetwork,
  HuduIpAddress,
  HuduVlan,
  HuduUser,
  HuduGroup,
  HuduAssetPassword,
  HuduUpload,
  HuduRackStorage,
  HuduRackStorageItem,
  HuduPublicPhoto,
  HuduPagedResponse,
  HuduLabel,
  HuduLabelType,
  HuduFlag,
  HuduFlagType,
} from '../types.js';
import { stripHtml, truncate, escapeMarkdown } from '../utils/html-stripper.js';
import { resolveNetworkType } from './enums.js';

// Alias for readability
const esc = escapeMarkdown;

// Wrapper to convert T[] to HuduPagedResponse<T>.
// The optional total argument carries the X-Total-Count header value when
// the caller has access to it (REQ-13 / PRB-02).
/**
 * Page sizes the Hudu API is known to ceiling at. When fewer rows come back
 * than were asked for AND the count lands exactly on one of these, the page was
 * almost certainly capped server-side rather than exhausted — `/asset_layouts`
 * ceilings at 25 (PRB-03) no matter what page_size says.
 */
const SERVER_PAGE_CEILINGS = [25, 50, 100, 250, 500, 1000];

export function toPagedResponse<T>(
  records: T[] | { records?: T[] } | null | undefined,
  page: number = 1,
  pageSize: number = 25,
  total?: number
): HuduPagedResponse<T> {
  // An executor that wrapped its rows in an envelope used to reach the
  // formatters as an object, and `.map()` on it killed the whole call (BUG-17).
  // Accept the envelope rather than let a shape mismatch become a crash.
  const list: T[] = Array.isArray(records)
    ? records
    : Array.isArray((records as { records?: T[] })?.records)
      ? ((records as { records: T[] }).records)
      : [];
  const paged: HuduPagedResponse<T> = {
    records: list,
    page,
    hasMore: list.length >= pageSize,
  };
  if (typeof total === 'number') {
    paged.total = total;
    // A real total answers the question outright; never guess over it.
    paged.hasMore = page * pageSize < total;
    return paged;
  }
  // Short page with a round count: cannot tell "set ended" from "server
  // capped". Saying "sem mais resultados" here is an assertion we cannot
  // support, and it is how a 25-row cap got reported as a 25-row instance.
  if (list.length > 0 && list.length < pageSize && SERVER_PAGE_CEILINGS.includes(list.length)) {
    paged.capSuspected = true;
  }
  return paged;
}

function pageInfo(paged: {
  page: number;
  hasMore: boolean;
  records: unknown[];
  total?: number;
  capSuspected?: boolean;
}): string {
  let more: string;
  if (paged.hasMore) {
    more = ` | Página ${paged.page}, mais disponíveis (próxima: ${paged.page + 1})`;
  } else if (paged.capSuspected) {
    more = ` | Página ${paged.page}, a API limitou a página a ${paged.records.length}; pode haver mais (peça a página ${paged.page + 1} para confirmar)`;
  } else {
    more = ` | Página ${paged.page}, sem mais resultados`;
  }
  const totalSuffix = typeof paged.total === 'number' ? ` | Total: ${paged.total}` : '';
  return `**${paged.records.length} resultados**${more}${totalSuffix}`;
}

// ---- Companies ----

export function formatCompanyList(paged: HuduPagedResponse<HuduCompany>): string {
  if (paged.records.length === 0) return 'Nenhuma empresa encontrada.';

  const rows = paged.records.map(
    (c) =>
      `| ${c.id} | ${esc(c.name)} | ${esc(c.company_type) || '-'} | ${esc(c.city) || '-'} | ${esc(c.state) || '-'} | ${c.archived ? 'Arquivado' : 'Ativo'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Tipo | Cidade | Estado | Status |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatCompanyDetail(c: HuduCompany): string {
  return [
    `# Empresa: ${c.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${c.id} |`,
    `| Nome | ${esc(c.name)} |`,
    `| Apelido | ${esc(c.nickname) || '-'} |`,
    `| Tipo | ${esc(c.company_type) || '-'} |`,
    `| Endereço | ${esc([c.address_line_1, c.address_line_2, c.city, c.state, c.zip].filter(Boolean).join(', ')) || '-'} |`,
    `| País | ${esc(c.country_name) || '-'} |`,
    `| Telefone | ${esc(c.phone_number) || '-'} |`,
    `| Website | ${esc(c.website) || '-'} |`,
    `| Status | ${c.archived ? 'Arquivado' : 'Ativo'} |`,
    `| Criado em | ${c.created_at ?? ''} |`,
    `| Atualizado em | ${c.updated_at ?? ''} |`,
    ...(c.notes ? ['', '## Notas', '', truncate(c.notes, 2000)] : []),
  ].join('\n');
}

// ---- Assets ----

export function formatAssetList(paged: HuduPagedResponse<HuduAsset>): string {
  if (paged.records.length === 0) return 'Nenhum ativo encontrado.';

  const rows = paged.records.map(
    (a) =>
      `| ${a.id} | ${esc(a.name)} | ${esc(a.company_name) || String(a.company_id)} | ${a.asset_layout_id} | ${esc(a.primary_serial) || '-'} | ${a.archived ? 'Arquivado' : 'Ativo'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa | Layout ID | Serial | Status |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatAssetDetail(a: HuduAsset): string {
  const lines = [
    `# Ativo: ${a.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${a.id} |`,
    `| Nome | ${esc(a.name)} |`,
    `| Empresa | ${esc(a.company_name) || String(a.company_id)} |`,
    `| Layout ID | ${a.asset_layout_id} |`,
    `| Serial | ${esc(a.primary_serial) || '-'} |`,
    `| Modelo | ${esc(a.primary_model) || '-'} |`,
    `| Fabricante | ${esc(a.primary_manufacturer) || '-'} |`,
    `| Status | ${a.archived ? 'Arquivado' : 'Ativo'} |`,
    `| Criado em | ${a.created_at ?? ''} |`,
    `| Atualizado em | ${a.updated_at ?? ''} |`,
  ];

  if (a.url) {
    lines.push(`| URL Hudu | ${a.url} |`);
  }

  if (a.fields && a.fields.length > 0) {
    lines.push('', '## Campos Personalizados', '');
    for (const f of a.fields) {
      if (f.value !== null && f.value !== undefined && f.value !== '') {
        lines.push(`- **${f.label}**: ${f.value}`);
      }
    }
  }

  return lines.join('\n');
}

// ---- Asset Layouts ----

export function formatAssetLayoutList(paged: HuduPagedResponse<HuduAssetLayout>): string {
  if (paged.records.length === 0) return 'Nenhum layout de ativo encontrado.';

  const rows = paged.records.map(
    (l) =>
      `| ${l.id} | ${esc(l.name)} | ${l.fields?.length ?? 0} campos | ${l.active ? 'Ativo' : 'Inativo'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Campos | Status |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatAssetLayoutDetail(l: HuduAssetLayout): string {
  const lines = [
    `# Layout de Ativo: ${l.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${l.id} |`,
    `| Nome | ${esc(l.name)} |`,
    `| Ícone | ${esc(l.icon) || '-'} |`,
    `| Cor | ${esc(l.color) || '-'} |`,
    `| Ativo | ${l.active ? 'Sim' : 'Não'} |`,
  ];

  if (l.fields && l.fields.length > 0) {
    lines.push('', '## Campos do Layout', '');
    lines.push('| Posição | Label | Tipo | Obrigatório | Mostrar na Lista |');
    lines.push('|---|---|---|---|---|');
    const sorted = [...l.fields].sort((a, b) => a.position - b.position);
    for (const f of sorted) {
      lines.push(
        `| ${f.position} | ${esc(f.label)} | ${esc(f.field_type)} | ${f.required ? 'Sim' : 'Não'} | ${f.show_in_list ? 'Sim' : 'Não'} |`
      );
    }
  }

  return lines.join('\n');
}

// ---- Articles (Knowledge Base) ----

export function formatArticleList(paged: HuduPagedResponse<HuduArticle>): string {
  if (paged.records.length === 0) return 'Nenhum artigo encontrado.';

  const rows = paged.records.map((a) => {
    // REQ-07 / BUG-07: show company name when available; fall back to ID
    const company = a.company_name
      ? `${esc(a.company_name)} (ID: ${a.company_id})`
      : (a.company_id ? String(a.company_id) : 'Global');
    return `| ${a.id} | ${esc(a.name)} | ${company} | ${a.draft ? 'Rascunho' : 'Publicado'} | ${a.updated_at ?? ''} |`;
  });

  return [
    pageInfo(paged),
    '',
    '| ID | Título | Empresa | Status | Atualizado |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatArticleDetail(a: HuduArticle): string {
  const content = a.content ? stripHtml(a.content) : 'Sem conteúdo.';
  // REQ-07 / BUG-07: show company name when available; fall back to ID
  const company = a.company_name
    ? `${esc(a.company_name)} (ID: ${a.company_id})`
    : (a.company_id ? `ID: ${a.company_id}` : 'Global');
  return [
    `# Artigo KB: ${a.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${a.id} |`,
    `| Empresa | ${company} |`,
    `| Pasta ID | ${a.folder_id ?? '-'} |`,
    `| Status | ${a.draft ? 'Rascunho' : 'Publicado'} |`,
    `| Criado em | ${a.created_at ?? ''} |`,
    `| Atualizado em | ${a.updated_at ?? ''} |`,
    ...(a.share_url ? [`| URL Compartilhamento | ${a.share_url} |`] : []),
    '',
    '## Conteúdo',
    '',
    truncate(content, 4000),
  ].join('\n');
}

// ---- Passwords ----

export function formatPasswordList(paged: HuduPagedResponse<HuduAssetPassword>): string {
  if (paged.records.length === 0) return 'Nenhuma senha encontrada.';

  const rows = paged.records.map(
    (p) =>
      `| ${p.id} | ${esc(p.name)} | ${esc(p.username) || '-'} | ${esc(p.url) || '-'} | ${esc(p.company_name) || (p.company_id ? String(p.company_id) : '-')} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Usuário | URL | Empresa |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatPasswordDetail(p: HuduAssetPassword): string {
  return [
    `# Senha: ${p.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${p.id} |`,
    `| Nome | ${esc(p.name)} |`,
    `| Usuário | ${esc(p.username) || '-'} |`,
    `| Senha | **** |`,
    `| URL | ${esc(p.url) || '-'} |`,
    `| Empresa | ${esc(p.company_name) || (p.company_id ? String(p.company_id) : '-')} |`,
    `| Tipo | ${esc(p.password_type) || '-'} |`,
    `| No Portal | ${p.in_portal ? 'Sim' : 'Não'} |`,
    `| Criado em | ${p.created_at ?? ''} |`,
    `| Atualizado em | ${p.updated_at ?? ''} |`,
    ...(p.description ? ['', '## Descrição', '', truncate(p.description, 1000)] : []),
  ].join('\n');
}

// ---- Expirations ----

export function formatExpirationList(paged: HuduPagedResponse<HuduExpiration>): string {
  if (paged.records.length === 0) return 'Nenhum vencimento encontrado.';

  const rows = paged.records.map(
    (e) =>
      `| ${e.id} | ${esc(e.expiration_type) || esc(e.item_type) || '-'} | ${esc(e.expirationable_type || e.item_type)}#${e.expirationable_id ?? e.item_id} | ${e.company_id ?? '-'} | ${e.date ?? e.expiration_date ?? ''} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Tipo | Recurso | Empresa ID | Data de Vencimento |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Websites ----

export function formatWebsiteList(paged: HuduPagedResponse<HuduWebsite>): string {
  if (paged.records.length === 0) return 'Nenhum website encontrado.';

  const rows = paged.records.map(
    (w) =>
      `| ${w.id} | ${esc(w.name)} | ${esc(w.company_name) || (w.company_id ? String(w.company_id) : '-')} | ${esc(w.url)} | ${w.paused ? 'Pausado' : 'Ativo'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa | URL | Status |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatWebsiteDetail(w: HuduWebsite): string {
  return [
    `# Website: ${esc(w.name)}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${w.id} |`,
    `| Nome | ${esc(w.name)} |`,
    `| Empresa | ${esc(w.company_name) || '-'} |`,
    `| URL | ${esc(w.url) || '-'} |`,
    `| Status | ${esc(w.status) || '-'} |`,
    `| Monitoramento | ${esc(w.monitoring_status) || '-'} |`,
    `| Pausado | ${w.paused ? 'Sim' : 'Não'} |`,
    `| Monitor DNS | ${w.disable_dns ? 'Desativado' : 'Ativado'} |`,
    `| Monitor SSL | ${w.disable_ssl ? 'Desativado' : 'Ativado'} |`,
    `| Monitor WHOIS | ${w.disable_whois ? 'Desativado' : 'Ativado'} |`,
    `| Rastreio DMARC | ${w.enable_dmarc_tracking ? 'Ativado' : 'Desativado'} |`,
    `| Rastreio DKIM | ${w.enable_dkim_tracking ? 'Ativado' : 'Desativado'} |`,
    `| Rastreio SPF | ${w.enable_spf_tracking ? 'Ativado' : 'Desativado'} |`,
    `| Criado em | ${w.created_at ?? ''} |`,
    `| Atualizado em | ${w.updated_at ?? ''} |`,
    ...(w.notes ? ['', '## Notas', '', truncate(w.notes, 2000)] : []),
  ].join('\n');
}

// ---- Activity Logs ----

export function formatActivityLogList(paged: HuduPagedResponse<HuduActivityLog>): string {
  if (paged.records.length === 0) return 'Nenhum log de atividade encontrado.';

  const rows = paged.records.map(
    (l) =>
      `| ${l.id} | ${l.created_at ?? ''} | ${esc(l.user_name) || esc(l.user_email) || '-'} | ${esc(l.action || l.action_message)} | ${esc(l.record_type) || '-'} | ${esc(l.record_name) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Data | Usuário | Ação | Tipo do Registro | Nome do Registro |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Folders ----

export function formatFolderList(paged: HuduPagedResponse<HuduFolder>): string {
  if (paged.records.length === 0) return 'Nenhuma pasta encontrada.';

  const rows = paged.records.map((f) => {
    // REQ-07 / BUG-07: show company name when available; fall back to ID
    const company = (f as any).company_name
      ? `${esc((f as any).company_name)} (ID: ${f.company_id})`
      : (f.company_id ? String(f.company_id) : 'Global');
    return `| ${f.id} | ${esc(f.name)} | ${company} | ${f.parent_folder_id ?? '-'} | ${truncate(f.description, 60)} |`;
  });

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa | Pai | Descrição |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Folder detail ----

export function formatFolderDetail(f: any): string {
  if (!f || typeof f !== 'object') return 'Pasta indisponível.';
  // REQ-07 / BUG-07: show company name when available; fall back to ID
  // REQ-08: include Nome row at the top of the detail table
  const company = f.company_name
    ? `${esc(f.company_name)} (ID: ${f.company_id})`
    : (f.company_id ? `ID: ${f.company_id}` : 'Global');
  return [
    `# Pasta: ${esc(f.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${f.id ?? '-'} |`,
    `| Nome | ${esc(f.name) || '-'} |`,
    `| Empresa | ${company} |`,
    `| Pasta pai | ${f.parent_folder_id ?? '-'} |`,
    `| Ícone | ${esc(f.icon) || '-'} |`,
    `| Criada em | ${f.created_at ?? '-'} |`,
    `| Atualizada em | ${f.updated_at ?? '-'} |`,
    ...(f.description ? ['', '## Descrição', '', truncate(f.description, 1000)] : []),
  ].join('\n');
}

// ---- Relations ----

/**
 * Format a relation endpoint as "Type "Name" (ID: N)" when name is known,
 * or "Type#N" as fallback.
 * REQ-09 / BUG-09
 */
// REQ-09 / BUG-09: the Hudu API returns endpoint TYPE + ID (and a per-endpoint
// URL) but NOT a per-endpoint name. The relation-level `name` field carries the
// related entity's name. We render each endpoint as `Type#id` (precise and
// unambiguous) and surface the human-readable `name` plus the entity URLs as
// separate columns/rows so the output is readable without N+1 lookups.
function formatRelationEndpoint(type: string, id: number): string {
  return `${esc(type)}#${id}`;
}

export function formatRelationList(paged: HuduPagedResponse<HuduRelation>): string {
  if (paged.records.length === 0) return 'Nenhuma relação encontrada.';

  const rows = paged.records.map((r) => {
    const from = formatRelationEndpoint(r.fromable_type, r.fromable_id);
    const to = formatRelationEndpoint(r.toable_type, r.toable_id);
    const nome = esc(r.name) || '-';
    return `| ${r.id} | ${from} | ${to} | ${nome} | ${truncate(r.description, 50)} |`;
  });

  return [
    pageInfo(paged),
    '',
    '| ID | De | Para | Nome | Descrição |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatRelationDetail(r: HuduRelation): string {
  const from = formatRelationEndpoint(r.fromable_type, r.fromable_id);
  const to = formatRelationEndpoint(r.toable_type, r.toable_id);
  return [
    `# Relação: ${esc(r.name) || `${from} -> ${to}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${r.id} |`,
    `| Nome | ${esc(r.name) || '-'} |`,
    `| Origem | ${from} |`,
    ...(r.fromable_url ? [`| URL Origem | ${esc(r.fromable_url)} |`] : []),
    `| Destino | ${to} |`,
    ...(r.toable_url ? [`| URL Destino | ${esc(r.toable_url)} |`] : []),
    `| Criado em | ${r.created_at ?? ''} |`,
    `| Atualizado em | ${r.updated_at ?? ''} |`,
    ...(r.description ? ['', '## Descrição', '', truncate(r.description, 2000)] : []),
  ].join('\n');
}

// ---- Procedures ----

/**
 * A Hudu list can mix processes (the definition) with runs (one execution of
 * it). Rendering both as "procedimento" made a finished run look like a
 * finished process, so the kind is now a column of its own.
 */
function procedureKind(p: HuduProcedure): string {
  if (p.run === true || (p.parent_process_id !== undefined && p.parent_process_id !== null)) {
    return 'Execução';
  }
  if (p.process_type === 'global') return 'Template global';
  if (p.process_type === 'company') return 'Processo';
  return 'Processo';
}

/**
 * Progress, or a dash when the API did not send it.
 *
 * `${p.completed ?? 0}/${p.total ?? 0}` turned two absent fields into "0/0",
 * which reads as "a process with no tasks at all" — a claim invented from
 * missing data. Absence gets rendered as absence.
 */
function progressLabel(p: HuduProcedure): string {
  if (p.completed === undefined && p.total === undefined) return '-';
  const done = p.completed ?? 0;
  const total = p.total ?? 0;
  const pct = p.completion_percentage ? ` (${p.completion_percentage})` : '';
  return `${done}/${total}${pct}`;
}

export function formatProcedureList(paged: HuduPagedResponse<HuduProcedure>): string {
  if (paged.records.length === 0) return 'Nenhum procedimento encontrado.';

  const rows = paged.records.map(
    (p) =>
      `| ${p.id} | ${esc(p.name)} | ${procedureKind(p)} | ${esc(p.company_name) || 'Global'} | ${p.status ?? '-'} | ${progressLabel(p)} | ${p.updated_at ?? ''} |`
  );

  const mixed =
    paged.records.some((p) => procedureKind(p) === 'Execução') &&
    paged.records.some((p) => procedureKind(p) !== 'Execução');

  return [
    pageInfo(paged),
    ...(mixed
      ? [
          '',
          '> A lista mistura processos e execuções. Use type="process" ou type="run" para separar.',
        ]
      : []),
    '',
    '| ID | Nome | Tipo | Empresa | Status | Progresso | Atualizado |',
    '|---|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatProcedureDetail(p: HuduProcedure): string {
  const kind = procedureKind(p);
  const tasks = p.procedure_tasks_attributes ?? p.tasks ?? [];
  return [
    `# ${kind}: ${p.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${p.id} |`,
    `| Nome | ${esc(p.name)} |`,
    `| Tipo | ${kind} |`,
    `| Empresa | ${esc(p.company_name) || 'Global'} |`,
    `| Status | ${p.status ?? '-'} |`,
    `| Progresso | ${progressLabel(p)} |`,
    ...(kind === 'Execução'
      ? [`| Processo de origem | ${p.parent_process_id ?? '-'} |`]
      : []),
    ...(p.asset ? [`| Ativo associado | ${p.asset} |`] : []),
    `| Criado em | ${p.created_at ?? ''} |`,
    `| Atualizado em | ${p.updated_at ?? ''} |`,
    ...(p.description
      ? ['', '## Descrição', '', truncate(stripHtml(p.description), 3000)]
      : []),
    ...(tasks.length
      ? [
          '',
          `## Tarefas (${tasks.length})`,
          '',
          '| ID | Tarefa | Status | Responsável | Prazo |',
          '|---|---|---|---|---|',
          ...tasks.map(
            (t) =>
              `| ${t.id} | ${esc(t.name) || '-'} | ${t.completed ? 'Concluída' : 'Pendente'} | ${esc(t.first_assigned_user_name) || '-'} | ${t.due_date ?? '-'} |`
          ),
        ]
      : []),
  ].join('\n');
}

// ---- Networks ----

export function formatNetworkList(paged: HuduPagedResponse<HuduNetwork>): string {
  if (paged.records.length === 0) return 'Nenhuma rede encontrada.';

  // REQ-06 / BUG-06: resolve network_type integer to human-readable label
  const rows = paged.records.map(
    (n) =>
      `| ${n.id} | ${esc(n.name)} | ${esc(n.address || n.network) || '-'} | ${esc(n.cidr || n.mask) || '-'} | ${resolveNetworkType(n.network_type as number | string | undefined)} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Endereço | Máscara/CIDR | Tipo |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatNetworkDetail(n: HuduNetwork): string {
  if (!n || typeof n !== 'object') return 'Rede indisponível.';
  return [
    `# Rede: ${esc(n.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${n.id ?? '-'} |`,
    `| Endereço | ${esc(n.address || n.network) || '-'} |`,
    `| Tipo | ${resolveNetworkType(n.network_type as number | string | undefined)} |`,
    `| Empresa ID | ${n.company_id ?? '-'} |`,
    `| Localização ID | ${n.location_id ?? '-'} |`,
    `| VLAN ID | ${n.vlan_id ?? '-'} |`,
    `| Slug | ${esc(n.slug) || '-'} |`,
    `| URL | ${esc(n.url) || '-'} |`,
    `| Criada em | ${n.created_at ?? '-'} |`,
    `| Atualizada em | ${n.updated_at ?? '-'} |`,
    ...(n.description ? ['', '## Descrição', '', truncate(n.description, 1000)] : []),
    ...(n.notes ? ['', '## Notas', '', truncate(n.notes, 2000)] : []),
  ].join('\n');
}

// ---- IP Addresses ----

// REQ-05 / BUG-05: the Hudu API does not expose network_id on IP records, but
// it DOES return asset_name (and asset_url). Surface the asset as the primary
// context. ipAssetLabel renders "Name (ID: N)" when the name is present.
function ipAssetLabel(ip: { asset_id?: number; asset_name?: string }): string {
  if (ip.asset_name && ip.asset_name.trim() !== '') {
    return `${esc(ip.asset_name)}${ip.asset_id ? ` (ID: ${ip.asset_id})` : ''}`;
  }
  return ip.asset_id ? `ID: ${ip.asset_id}` : '-';
}

export function formatIpAddressList(paged: HuduPagedResponse<HuduIpAddress>): string {
  if (paged.records.length === 0) return 'Nenhum endereço IP encontrado.';

  const rows = paged.records.map(
    (ip) =>
      `| ${ip.id} | ${esc(ip.address)} | ${esc(ip.hostname || ip.fqdn) || '-'} | ${ipAssetLabel(ip)} | ${esc(ip.status) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Endereço | Hostname | Ativo | Status |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatIpAddressDetail(ip: any): string {
  if (!ip || typeof ip !== 'object') return 'Endereço IP indisponível.';
  const empresa = ip.company_name
    ? `${esc(ip.company_name)} (ID: ${ip.company_id})`
    : (ip.company_id ? `ID: ${ip.company_id}` : '-');
  return [
    `# Endereço IP: ${esc(ip.address) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${ip.id ?? '-'} |`,
    `| FQDN | ${esc(ip.fqdn) || '-'} |`,
    `| Status | ${esc(ip.status) || '-'} |`,
    `| Ativo | ${ipAssetLabel(ip)} |`,
    `| Empresa | ${empresa} |`,
    // network_id is not returned by Hudu API 2.41.2; shown only when present.
    ...(ip.network_id != null ? [`| Rede ID | ${ip.network_id} |`] : []),
    `| Criado em | ${ip.created_at ?? '-'} |`,
    `| Atualizado em | ${ip.updated_at ?? '-'} |`,
    ...(ip.description ? ['', '## Descrição', '', truncate(ip.description, 1000)] : []),
    ...(ip.notes ? ['', '## Notas', '', truncate(ip.notes, 2000)] : []),
  ].join('\n');
}

// ---- VLANs ----

export function formatVlanList(paged: HuduPagedResponse<HuduVlan>): string {
  if (paged.records.length === 0) return 'Nenhuma VLAN encontrada.';

  // Hudu API returns `vlan_id` for the numeric 802.1Q tag; `vid` was a legacy alias.
  const rows = paged.records.map(
    (v) => `| ${v.id} | ${v.vlan_id ?? v.vid ?? '-'} | ${esc(v.name)} | ${v.company_id ?? '-'} | ${v.vlan_zone_id ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | VLAN ID | Nome | Empresa ID | Zona ID |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatVlanDetail(v: HuduVlan): string {
  if (!v || typeof v !== 'object') return 'VLAN indisponível.';
  return [
    `# VLAN: ${esc(v.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${v.id ?? '-'} |`,
    `| VLAN ID (tag) | ${v.vlan_id ?? v.vid ?? '-'} |`,
    `| Empresa ID | ${v.company_id ?? '-'} |`,
    `| Zona ID | ${v.vlan_zone_id ?? '-'} |`,
    `| Redes | ${v.networks_count ?? 0} |`,
    `| URL | ${esc(v.url) || '-'} |`,
    `| Criada em | ${v.created_at ?? '-'} |`,
    `| Atualizada em | ${v.updated_at ?? '-'} |`,
    ...(v.description ? ['', '## Descrição', '', truncate(v.description, 1000)] : []),
    ...(v.notes ? ['', '## Notas', '', truncate(v.notes, 2000)] : []),
  ].join('\n');
}

// ---- Users ----

export function formatUserList(paged: HuduPagedResponse<HuduUser>): string {
  if (paged.records.length === 0) return 'Nenhum usuário encontrado.';

  const rows = paged.records.map(
    (u) =>
      `| ${u.id} | ${esc(`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()) || '-'} | ${esc(u.email)} | ${u.admin ? 'Sim' : 'Não'} | ${u.active ? 'Sim' : 'Não'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Email | Admin | Ativo |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Groups ----

export function formatGroupList(paged: HuduPagedResponse<HuduGroup>): string {
  if (paged.records.length === 0) return 'Nenhum grupo encontrado.';

  const rows = paged.records.map(
    (g) => `| ${g.id} | ${esc(g.name)} | ${esc(g.permissions?.join(', ') || '-')} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Permissões |',
    '|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Magic Dash ----

export function formatMagicDashList(paged: HuduPagedResponse<HuduMagicDash>): string {
  if (paged.records.length === 0) return 'Nenhum widget encontrado.';

  const rows = paged.records.map(
    (d) =>
      `| ${d.id} | ${esc(d.title || d.name)} | ${esc(d.company_name) || (d.company_id ? String(d.company_id) : '-')} | ${esc(d.content_link || d.dashboard_url) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa | URL |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatMagicDashDetail(d: HuduMagicDash): string {
  return [
    `# Widget: ${d.title || d.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${d.id} |`,
    `| Nome | ${esc(d.title || d.name)} |`,
    `| Empresa | ${esc(d.company_name) || '-'} |`,
    `| URL | ${esc(d.content_link || d.dashboard_url) || '-'} |`,
    `| Criado em | ${d.created_at ?? ''} |`,
    `| Atualizado em | ${d.updated_at ?? ''} |`,
    ...(d.message ? ['', '## Mensagem', '', truncate(d.message, 2000)] : []),
    ...(d.content ? ['', '## Conteúdo', '', truncate(d.content, 2000)] : []),
  ].join('\n');
}

// ---- Uploads ----

export function formatUploadList(paged: HuduPagedResponse<HuduUpload>): string {
  if (paged.records.length === 0) return 'Nenhum upload encontrado.';

  const rows = paged.records.map(
    (u) =>
      `| ${u.id} | ${esc(u.name)} | ${esc(u.filename)} | ${u.size ?? '-'} | ${esc(u.content_type) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Arquivo | Tamanho | Tipo |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatUploadDetail(u: any): string {
  if (!u || typeof u !== 'object') return 'Upload indisponível.';
  return [
    `# Upload: ${esc(u.name) || esc(u.filename) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${u.id ?? '-'} |`,
    `| Arquivo | ${esc(u.filename) || '-'} |`,
    `| Tamanho | ${u.size ?? '-'} |`,
    `| Tipo | ${esc(u.content_type) || '-'} |`,
    `| Vinculado a | ${esc(u.uploadable_type) || '-'}#${u.uploadable_id ?? '-'} |`,
    `| URL | ${esc(u.url) || '-'} |`,
    `| Criado em | ${u.created_at ?? '-'} |`,
  ].join('\n');
}

// ---- Rack Storage ----

export function formatRackStorageList(paged: HuduPagedResponse<HuduRackStorage>): string {
  if (paged.records.length === 0) return 'Nenhum rack encontrado.';

  const rows = paged.records.map(
    (r) =>
      `| ${r.id} | ${esc(r.name)} | ${r.company_id ?? '-'} | ${truncate(r.description, 60)} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa ID | Descrição |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatRackStorageDetail(r: any): string {
  if (!r || typeof r !== 'object') return 'Rack indisponível.';
  return [
    `# Rack: ${esc(r.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${r.id ?? '-'} |`,
    `| Empresa ID | ${r.company_id ?? '-'} |`,
    `| Altura (U) | ${r.height ?? '-'} |`,
    `| Largura (pol) | ${r.width ?? '-'} |`,
    `| Unidade inicial | ${r.starting_unit ?? '-'} |`,
    `| Unidades descendentes | ${r.descending_units ? 'Sim' : 'Não'} |`,
    `| Watts máximos | ${r.max_wattage ?? '-'} |`,
    `| Utilização | ${r.utilization ?? 0}% |`,
    `| Serial | ${esc(r.serial_number) || '-'} |`,
    `| Asset tag | ${esc(r.asset_tag) || '-'} |`,
    `| Localização | ${esc(r.location_name) || '-'} (ID: ${r.location_id ?? '-'}) |`,
    ...(r.description ? ['', '## Descrição', '', truncate(r.description, 1000)] : []),
  ].join('\n');
}

// ---- Rack Storage Items ----

export function formatRackStorageItemList(
  paged: HuduPagedResponse<HuduRackStorageItem>
): string {
  if (paged.records.length === 0) return 'Nenhum item de rack encontrado.';

  const rows = paged.records.map(
    (i: any) =>
      `| ${i.id} | ${esc(i.name || i.rack_storage_role_name) || '-'} | ${i.rack_storage_id ?? '-'} | ${i.start_unit ?? i.position ?? '-'}–${i.end_unit ?? '-'} | ${esc(i.status) || '-'} | ${esc(i.side) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome/Role | Rack ID | Ocupação (U) | Status | Lado |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatRackStorageItemDetail(i: any): string {
  if (!i || typeof i !== 'object') return 'Item de rack indisponível.';
  return [
    `# Item de Rack: ${esc(i.rack_storage_role_name) || esc(i.name) || `#${i.id}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${i.id ?? '-'} |`,
    `| Rack ID | ${i.rack_storage_id ?? '-'} |`,
    `| Role ID | ${i.rack_storage_role_id ?? '-'} |`,
    `| Ativo ID | ${i.asset_id ?? '-'} |`,
    `| Unidade inicial | ${i.start_unit ?? '-'} |`,
    `| Unidade final | ${i.end_unit ?? '-'} |`,
    `| Status | ${esc(i.status) || '-'} |`,
    `| Lado | ${esc(i.side) || '-'} |`,
    `| Watts máximos | ${i.max_wattage ?? '-'} |`,
    `| Consumo real | ${i.power_draw ?? '-'} |`,
    ...(i.reserved_message ? ['', '## Mensagem', '', truncate(i.reserved_message, 500)] : []),
  ].join('\n');
}

// ---- Public Photos ----

export function formatPublicPhotoList(paged: HuduPagedResponse<HuduPublicPhoto>): string {
  if (paged.records.length === 0) return 'Nenhuma foto encontrada.';

  // REQ-10 / BUG-08: surface name and filename even when empty (use '-' placeholder)
  const rows = paged.records.map(
    (p) => `| ${p.id} | ${esc(p.name) || '-'} | ${esc(p.filename) || '-'} | ${esc(p.url) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Arquivo | URL |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatPublicPhotoDetail(p: any): string {
  if (!p || typeof p !== 'object') return 'Foto indisponível.';
  // REQ-10 / BUG-08: surface name and filename even when empty (use '-' placeholder)
  return [
    `# Foto pública: ${esc(p.name) || esc(p.filename) || `#${p.id}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${p.id ?? '-'} |`,
    `| Nome | ${esc(p.name) || '-'} |`,
    `| Arquivo | ${esc(p.filename) || '-'} |`,
    `| URL | ${esc(p.url) || '-'} |`,
    `| Vinculada a | ${esc(p.record_type) || '-'}#${p.record_id ?? '-'} |`,
    `| Criada em | ${p.created_at ?? '-'} |`,
  ].join('\n');
}

// ---- Admin: API info ----

export function formatApiInfo(info: any): string {
  if (!info || typeof info !== 'object') return 'Informações da API indisponíveis.';
  const rows: string[] = [];
  for (const [k, v] of Object.entries(info)) {
    const value = v === null || v === undefined ? '-' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    rows.push(`| ${esc(k)} | ${esc(value)} |`);
  }
  return [
    '# Informações da API do Hudu',
    '',
    '| Campo | Valor |',
    '|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Admin: Exports ----

export function formatExportsList(data: any, variant: 'standard' | 's3' = 'standard'): string {
  const records: any[] = Array.isArray(data) ? data : (data?.exports ?? data?.s3_exports ?? []);
  if (!records || records.length === 0) {
    return variant === 's3' ? 'Nenhuma exportação S3 encontrada.' : 'Nenhuma exportação encontrada.';
  }
  const rows = records.map((e) =>
    `| ${e.id ?? '-'} | ${esc(e.name) || esc(e.filename) || '-'} | ${esc(e.format) || '-'} | ${esc(e.status) || '-'} | ${e.created_at ?? '-'} | ${esc(e.url || e.download_url) || '-'} |`
  );
  return [
    `**${records.length} ${variant === 's3' ? 'exportações S3' : 'exportações'} encontradas**`,
    '',
    '| ID | Nome | Formato | Status | Criada em | URL |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Search All Resource Types (global multi-domain search) ----

export function formatGlobalSearchResults(data: any, query?: string): string {
  const articles: any[] = data?.articles ?? [];
  const assets: any[] = data?.assets ?? [];
  const passwords: any[] = data?.passwords ?? [];
  const companies: any[] = data?.companies ?? [];

  const totalResults = articles.length + assets.length + passwords.length + companies.length;
  if (totalResults === 0) {
    return `Nenhum resultado encontrado${query ? ` para "${esc(query)}"` : ''}.`;
  }

  const sections: string[] = [
    `# Busca global no Hudu${query ? `: "${esc(query)}"` : ''}`,
    '',
    `**${totalResults} resultados** — Artigos: ${articles.length} · Ativos: ${assets.length} · Senhas: ${passwords.length} · Empresas: ${companies.length}`,
    '',
  ];

  if (companies.length > 0) {
    sections.push('## Empresas', '');
    sections.push('| ID | Nome | Cidade | Estado |', '|---|---|---|---|');
    for (const c of companies) {
      sections.push(`| ${c.id} | ${esc(c.name)} | ${esc(c.city) || '-'} | ${esc(c.state) || '-'} |`);
    }
    sections.push('');
  }

  if (assets.length > 0) {
    sections.push('## Ativos', '');
    sections.push('| ID | Nome | Tipo | Empresa |', '|---|---|---|---|');
    for (const a of assets) {
      sections.push(`| ${a.id} | ${esc(a.name)} | ${esc(a.asset_type) || '-'} | ${esc(a.company_name) || (a.company_id ?? '-')} |`);
    }
    sections.push('');
  }

  if (articles.length > 0) {
    sections.push('## Artigos', '');
    sections.push('| ID | Título | Empresa ID | Atualizado |', '|---|---|---|---|');
    for (const ar of articles) {
      sections.push(`| ${ar.id} | ${esc(ar.name)} | ${ar.company_id ?? 'Global'} | ${ar.updated_at ?? '-'} |`);
    }
    sections.push('');
  }

  if (passwords.length > 0) {
    sections.push('## Senhas', '');
    sections.push('| ID | Nome | Usuário | Empresa ID |', '|---|---|---|---|');
    for (const p of passwords) {
      sections.push(`| ${p.id} | ${esc(p.name)} | ${esc(p.username) || '-'} | ${p.company_id ?? '-'} |`);
    }
    sections.push('');
  }

  return sections.join('\n').trimEnd();
}

// ---- Navigation results (produced by executeNavigationTool) ----

export function formatNavigationResult(data: any): string {
  const action: string = data?.action ?? 'desconhecida';
  const query: string = data?.query ?? '';
  const results: any[] = Array.isArray(data?.results) ? data.results : [];

  if (results.length === 0) {
    return `Nenhum registro encontrado para "${esc(query)}" (ação: ${esc(action)}).`;
  }

  const rows = results.map(
    (r) =>
      `| ${r.id} | ${esc(r.type) || '-'} | ${esc(r.name)} | ${esc(r.company_name) || (r.company_id ?? '-')} | ${esc(r.url) || '-'} |`
  );

  return [
    `**${results.length} registro(s) para "${esc(query)}"** (ação: ${esc(action)})`,
    '',
    '| ID | Tipo | Nome | Empresa | URL |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Procedure Tasks ----

/**
 * Owner column. The serializer only names the FIRST of `assigned_users`, so a
 * task owned by three people rendered as one name with nothing to say the
 * others existed — a wrong answer, not a terse one.
 */
function ownersLabel(t: any): string {
  const first = escapeMarkdown(t.first_assigned_user_name) || '-';
  const total = Array.isArray(t.assigned_users) ? t.assigned_users.length : 0;
  return total > 1 ? `${first} +${total - 1}` : first;
}

export function formatProcedureTaskList(paged: HuduPagedResponse<any>): string {
  if (paged.records.length === 0) return 'Nenhuma tarefa de procedimento encontrada.';

  const rows = paged.records.map(
    (t) =>
      `| ${t.id} | ${esc(t.name) || '-'} | ${t.procedure_id ?? '-'} | ${t.position ?? '-'} | ${t.completed ? 'Concluída' : 'Pendente'} | ${ownersLabel(t)} | ${t.due_date ?? '-'} | ${t.priority ?? '-'} | ${t.has_subtasks ? (t.subtask_count ?? 'sim') : '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Procedimento | Posição | Status | Responsável | Prazo | Prioridade | Subtarefas |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatProcedureTaskDetail(t: any): string {
  if (!t || typeof t !== 'object') return 'Tarefa indisponível.';
  return [
    `# Tarefa: ${esc(t.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${t.id ?? '-'} |`,
    `| Procedimento ID | ${t.procedure_id ?? '-'} |`,
    `| Posição | ${t.position ?? '-'} |`,
    `| Concluída | ${t.completed ? 'Sim' : 'Não'} |`,
    ...(t.completed && t.completed_date ? [`| Concluída em | ${t.completed_date} |`] : []),
    ...(t.completed && t.user_name ? [`| Concluída por | ${esc(t.user_name)} |`] : []),
    ...(t.completion_notes ? [`| Observações | ${esc(truncate(t.completion_notes, 500))} |`] : []),
    `| Prazo | ${t.formatted_due_date ?? t.due_date ?? '-'} |`,
    `| Prioridade | ${t.priority ?? '-'} |`,
    `| Opcional | ${t.optional ? 'Sim' : 'Não'} |`,
    `| Responsável | ${esc(t.first_assigned_user_name) || '-'} |`,
    ...(Array.isArray(t.assigned_users) && t.assigned_users.length > 1
      ? [
          // "Demais" has to exclude the one already named above; it listed all
          // of them, so the principal appeared twice under a heading saying
          // "the others".
          `| Demais responsáveis (IDs) | ${t.assigned_users.filter((u: number) => u !== t.first_assigned_user_id).join(', ')} |`
        ]
      : []),
    ...(t.parent_task_id ? [`| Subtarefa de | ${t.parent_task_id} |`] : []),
    ...(t.has_subtasks ? [`| Subtarefas | ${t.subtask_count ?? (t.subtask_ids?.length ?? '-')} |`] : []),
    `| Criada em | ${t.created_at ?? '-'} |`,
    `| Atualizada em | ${t.updated_at ?? '-'} |`,
    ...(t.description ? ['', '## Descrição', '', truncate(stripHtml(t.description), 2000)] : []),
  ].join('\n');
}

// ---- VLAN Zones ----

export function formatVlanZoneList(paged: HuduPagedResponse<any>): string {
  if (paged.records.length === 0) return 'Nenhuma zona de VLAN encontrada.';

  const rows = paged.records.map(
    (z) =>
      `| ${z.id} | ${esc(z.name)} | ${z.company_id ?? '-'} | ${truncate(z.description, 60)} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa ID | Descrição |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatVlanZoneDetail(z: any): string {
  if (!z || typeof z !== 'object') return 'Zona indisponível.';
  return [
    `# Zona de VLAN: ${esc(z.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${z.id ?? '-'} |`,
    `| Nome | ${esc(z.name) || '-'} |`,
    `| Empresa ID | ${z.company_id ?? '-'} |`,
    `| Criada em | ${z.created_at ?? '-'} |`,
    `| Atualizada em | ${z.updated_at ?? '-'} |`,
    ...(z.description ? ['', '## Descrição', '', truncate(z.description, 1000)] : []),
  ].join('\n');
}

// ---- Labels ----

const LABELABLE_LABELS: Record<string, string> = {
  Article: 'Artigo',
  Asset: 'Ativo',
  AssetPassword: 'Senha',
  Website: 'Site',
  IpAddress: 'Endereço IP',
  Vlan: 'VLAN',
  VlanZone: 'Zona de VLAN',
  Procedure: 'Procedimento',
  Network: 'Rede',
  RackStorage: 'Rack',
};

function recordTypeLabel(type: string | undefined, map: Record<string, string>): string {
  if (!type) return '-';
  return map[type] ? `${map[type]} (${type})` : type;
}

function labelScope(t: HuduLabelType): string {
  if (t.access_level === 'specific_companies' && t.allowed_company_ids?.length) {
    return `${t.allowed_company_ids.length} empresa(s)`;
  }
  return 'Todas as empresas';
}

export function formatLabelTypeList(paged: HuduPagedResponse<HuduLabelType>): string {
  if (paged.records.length === 0) return 'Nenhuma etiqueta encontrada no catálogo.';

  // Columns follow the include groups the caller actually asked for. The
  // groups were being fetched and then dropped here: `include: ["meta"]` put
  // created_at/updated_at in the payload and the table had no column for them,
  // so the model asked for dates, got none, and concluded there were none.
  const hasScope = paged.records.some(
    (t) => t.applicable_record_types !== undefined || t.access_level !== undefined
  );
  const hasMeta = paged.records.some((t) => t.created_at !== undefined || t.updated_at !== undefined);

  const cols: string[] = ['ID', 'Nome', 'Cor', 'Slug'];
  if (hasScope) cols.push('Aplicável a', 'Escopo');
  if (hasMeta) cols.push('Criada em', 'Atualizada em');

  const rows = paged.records.map((t) => {
    const cells: string[] = [String(t.id), esc(t.name), t.color ?? '-', t.slug ?? '-'];
    if (hasScope) {
      cells.push(
        t.applicable_record_types?.length ? t.applicable_record_types.join(', ') : 'Todos',
        labelScope(t)
      );
    }
    if (hasMeta) cells.push(t.created_at ?? '-', t.updated_at ?? '-');
    return `| ${cells.join(' | ')} |`;
  });

  return [
    pageInfo(paged),
    '',
    `| ${cols.join(' | ')} |`,
    `|${cols.map(() => '---').join('|')}|`,
    ...rows,
  ].join('\n');
}

export function formatLabelTypeDetail(t: HuduLabelType): string {
  if (!t || typeof t !== 'object') return 'Etiqueta indisponível.';
  return [
    `# Etiqueta: ${esc(t.name)}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${t.id} |`,
    `| Nome | ${esc(t.name)} |`,
    `| Cor | ${t.color ?? '-'} |`,
    `| Slug | ${t.slug ?? '-'} |`,
    `| Aplicável a | ${t.applicable_record_types?.length ? t.applicable_record_types.join(', ') : 'Todos os tipos'} |`,
    `| Escopo | ${labelScope(t)} |`,
    ...(t.allowed_company_ids?.length
      ? [`| Empresas permitidas (IDs) | ${t.allowed_company_ids.join(', ')} |`]
      : []),
    `| Criada em | ${t.created_at ?? '-'} |`,
    `| Atualizada em | ${t.updated_at ?? '-'} |`,
  ].join('\n');
}

type HydratedLabel = HuduLabel & { label_type_name?: string; label_type_color?: string };

export function formatLabelList(paged: HuduPagedResponse<HydratedLabel>): string {
  if (paged.records.length === 0) return 'Nenhuma etiqueta aplicada encontrada.';

  const rows = paged.records.map(
    (l) =>
      `| ${l.id} | ${esc(l.label_type_name) || `#${l.label_type_id}`} | ${recordTypeLabel(l.labelable_type, LABELABLE_LABELS)} | ${l.labelable_id} | ${l.created_at ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Etiqueta | Tipo de registro | ID do registro | Aplicada em |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatLabelDetail(l: HydratedLabel): string {
  if (!l || typeof l !== 'object') return 'Aplicação de etiqueta indisponível.';
  return [
    `# Etiqueta aplicada: ${esc(l.label_type_name) || `#${l.label_type_id}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID da aplicação | ${l.id} |`,
    `| Etiqueta | ${esc(l.label_type_name) || '-'} (ID ${l.label_type_id}) |`,
    ...(l.label_type_color ? [`| Cor | ${l.label_type_color} |`] : []),
    `| Tipo de registro | ${recordTypeLabel(l.labelable_type, LABELABLE_LABELS)} |`,
    `| ID do registro | ${l.labelable_id} |`,
    `| Aplicada por (user ID) | ${l.user_id ?? '-'} |`,
    `| Aplicada em | ${l.created_at ?? '-'} |`,
  ].join('\n');
}

// ---- Flags ----

const FLAGABLE_LABELS: Record<string, string> = {
  Asset: 'Ativo',
  Website: 'Site',
  Article: 'Artigo',
  AssetPassword: 'Senha',
  Company: 'Empresa',
  Procedure: 'Procedimento',
  RackStorage: 'Rack',
  Network: 'Rede',
  IpAddress: 'Endereço IP',
  Vlan: 'VLAN',
  VlanZone: 'Zona de VLAN',
};

export function formatFlagTypeList(paged: HuduPagedResponse<HuduFlagType>): string {
  if (paged.records.length === 0) return 'Nenhum tipo de sinalização cadastrado.';

  const rows = paged.records.map(
    (t) => `| ${t.id} | ${esc(t.name)} | ${t.color ?? '-'} | ${t.slug ?? '-'} | ${t.created_at ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Cor | Slug | Criado em |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatFlagTypeDetail(t: HuduFlagType): string {
  if (!t || typeof t !== 'object') return 'Tipo de sinalização indisponível.';
  return [
    `# Tipo de sinalização: ${esc(t.name)}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${t.id} |`,
    `| Nome | ${esc(t.name)} |`,
    `| Cor | ${t.color ?? '-'} |`,
    `| Slug | ${t.slug ?? '-'} |`,
    `| Criado em | ${t.created_at ?? '-'} |`,
    `| Atualizado em | ${t.updated_at ?? '-'} |`,
  ].join('\n');
}

type HydratedFlag = HuduFlag & { flag_type_name?: string; flag_type_color?: string };

export function formatFlagList(paged: HuduPagedResponse<HydratedFlag>): string {
  if (paged.records.length === 0) return 'Nenhum registro sinalizado encontrado.';

  const rows = paged.records.map(
    (f) =>
      `| ${f.id} | ${esc(f.flag_type_name) || `#${f.flag_type_id}`} | ${recordTypeLabel(f.flagable_type, FLAGABLE_LABELS)} | ${f.flagable_id} | ${esc(truncate(f.description ?? '', 80)) || '-'} | ${f.created_at ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Sinalização | Tipo de registro | ID do registro | Motivo | Sinalizado em |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatFlagDetail(f: HydratedFlag): string {
  if (!f || typeof f !== 'object') return 'Sinalização indisponível.';
  return [
    `# Sinalização: ${esc(f.flag_type_name) || `#${f.flag_type_id}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID da sinalização | ${f.id} |`,
    `| Tipo | ${esc(f.flag_type_name) || '-'} (ID ${f.flag_type_id}) |`,
    ...(f.flag_type_color ? [`| Cor | ${f.flag_type_color} |`] : []),
    `| Tipo de registro | ${recordTypeLabel(f.flagable_type, FLAGABLE_LABELS)} |`,
    `| ID do registro | ${f.flagable_id} |`,
    `| Sinalizado em | ${f.created_at ?? '-'} |`,
    `| Atualizado em | ${f.updated_at ?? '-'} |`,
    ...(f.description ? ['', '## Motivo', '', truncate(stripHtml(f.description), 2000)] : []),
  ].join('\n');
}
