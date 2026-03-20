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
} from '../types.js';
import { stripHtml, truncate, escapeMarkdown } from '../utils/html-stripper.js';

// Alias for readability
const esc = escapeMarkdown;

// Wrapper to convert T[] to HuduPagedResponse<T>
export function toPagedResponse<T>(
  records: T[],
  page: number = 1,
  pageSize: number = 25
): HuduPagedResponse<T> {
  return {
    records: records || [],
    page,
    hasMore: (records || []).length >= pageSize,
  };
}

function pageInfo(paged: { page: number; hasMore: boolean; records: unknown[] }): string {
  const more = paged.hasMore
    ? ` | Pagina ${paged.page}, mais disponíveis (próxima: ${paged.page + 1})`
    : ` | Pagina ${paged.page}, sem mais resultados`;
  return `**${paged.records.length} resultados**${more}`;
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

  const rows = paged.records.map(
    (a) =>
      `| ${a.id} | ${esc(a.name)} | ${a.company_id ?? 'Global'} | ${a.draft ? 'Rascunho' : 'Publicado'} | ${a.updated_at ?? ''} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Título | Empresa ID | Status | Atualizado |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatArticleDetail(a: HuduArticle): string {
  const content = a.content ? stripHtml(a.content) : 'Sem conteúdo.';
  return [
    `# Artigo KB: ${a.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${a.id} |`,
    `| Empresa ID | ${a.company_id ?? 'Global'} |`,
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

  const rows = paged.records.map(
    (f) =>
      `| ${f.id} | ${esc(f.name)} | ${f.company_id ?? 'Global'} | ${f.parent_folder_id ?? '-'} | ${truncate(f.description, 60)} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa ID | Pai | Descrição |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Relations ----

export function formatRelationList(paged: HuduPagedResponse<HuduRelation>): string {
  if (paged.records.length === 0) return 'Nenhuma relação encontrada.';

  const rows = paged.records.map(
    (r) =>
      `| ${r.id} | ${esc(r.fromable_type)}#${r.fromable_id} | ${esc(r.toable_type)}#${r.toable_id} | ${truncate(r.description, 60)} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | De | Para | Descrição |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Procedures ----

export function formatProcedureList(paged: HuduPagedResponse<HuduProcedure>): string {
  if (paged.records.length === 0) return 'Nenhum procedimento encontrado.';

  const rows = paged.records.map(
    (p) =>
      `| ${p.id} | ${esc(p.name)} | ${esc(p.company_name) || 'Global'} | ${p.completion_percentage ?? '-'} | ${p.updated_at ?? ''} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Empresa | Progresso | Atualizado |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function formatProcedureDetail(p: HuduProcedure): string {
  return [
    `# Procedimento: ${p.name}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${p.id} |`,
    `| Nome | ${esc(p.name)} |`,
    `| Empresa | ${esc(p.company_name) || 'Global'} |`,
    `| Progresso | ${p.completed ?? 0}/${p.total ?? 0} (${p.completion_percentage ?? '-'}) |`,
    `| Criado em | ${p.created_at ?? ''} |`,
    `| Atualizado em | ${p.updated_at ?? ''} |`,
    ...(p.description
      ? ['', '## Descrição', '', truncate(stripHtml(p.description), 3000)]
      : []),
  ].join('\n');
}

// ---- Networks ----

export function formatNetworkList(paged: HuduPagedResponse<HuduNetwork>): string {
  if (paged.records.length === 0) return 'Nenhuma rede encontrada.';

  const rows = paged.records.map(
    (n) =>
      `| ${n.id} | ${esc(n.name)} | ${esc(n.address || n.network) || '-'} | ${esc(n.cidr || n.mask) || '-'} | ${esc(n.network_type) || '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Endereço | Máscara/CIDR | Tipo |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- IP Addresses ----

export function formatIpAddressList(paged: HuduPagedResponse<HuduIpAddress>): string {
  if (paged.records.length === 0) return 'Nenhum endereço IP encontrado.';

  const rows = paged.records.map(
    (ip) =>
      `| ${ip.id} | ${esc(ip.address)} | ${esc(ip.hostname || ip.fqdn) || '-'} | ${ip.network_id ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Endereço | Hostname | Rede ID |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- VLANs ----

export function formatVlanList(paged: HuduPagedResponse<HuduVlan>): string {
  if (paged.records.length === 0) return 'Nenhuma VLAN encontrada.';

  const rows = paged.records.map(
    (v) => `| ${v.id} | ${v.vid ?? ''} | ${esc(v.name)} | ${v.network_id ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | VID | Nome | Rede ID |',
    '|---|---|---|---|',
    ...rows,
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

// ---- Rack Storage Items ----

export function formatRackStorageItemList(
  paged: HuduPagedResponse<HuduRackStorageItem>
): string {
  if (paged.records.length === 0) return 'Nenhum item de rack encontrado.';

  const rows = paged.records.map(
    (i) =>
      `| ${i.id} | ${esc(i.name)} | ${i.rack_storage_id} | ${i.position ?? '-'} | ${i.size ?? '-'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Rack ID | Posição | Tamanho |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- Public Photos ----

export function formatPublicPhotoList(paged: HuduPagedResponse<HuduPublicPhoto>): string {
  if (paged.records.length === 0) return 'Nenhuma foto encontrada.';

  const rows = paged.records.map(
    (p) => `| ${p.id} | ${esc(p.name)} | ${esc(p.filename)} | ${esc(p.url)} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Arquivo | URL |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}
