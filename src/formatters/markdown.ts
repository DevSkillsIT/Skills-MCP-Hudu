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
    `| Fax | ${esc(c.fax_number) || '-'} |`,
    `| Website | ${esc(c.website) || '-'} |`,
    `| CNPJ/ID | ${esc(c.id_number) || '-'} |`,
    `| Empresa Pai | ${c.parent_company_name ? `${esc(c.parent_company_name)} (ID: ${c.parent_company_id})` : '-'} |`,
    `| URL Hudu | ${esc(c.full_url) || '-'} |`,
    `| URL Senhas | ${esc(c.passwords_url) || '-'} |`,
    `| URL Base Conhecimento | ${esc(c.knowledge_base_url) || '-'} |`,
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
    `| Tipo | ${esc(a.asset_type) || '-'} |`,
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
    `| Cor do Ícone | ${esc(l.icon_color) || '-'} |`,
    `| Ativo | ${l.active ? 'Sim' : 'Não'} |`,
    `| Inclui Senhas | ${l.include_passwords ? 'Sim' : 'Não'} |`,
    `| Inclui Fotos | ${l.include_photos ? 'Sim' : 'Não'} |`,
    `| Inclui Comentários | ${l.include_comments ? 'Sim' : 'Não'} |`,
    `| Inclui Arquivos | ${l.include_files ? 'Sim' : 'Não'} |`,
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
      `| ${p.id} | ${esc(p.name)} | ${esc(p.username) || '-'} | ${esc(p.login_url) || '-'} | ${esc(p.url) || '-'} | ${esc(p.company_name) || (p.company_id ? String(p.company_id) : '-')} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Usuário | URL Acesso | URL Hudu | Empresa |',
    '|---|---|---|---|---|---|',
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
    `| URL de Acesso | ${esc(p.login_url) || '-'} |`,
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
    `| Empresa | ${esc(w.company_name) || (w.company_id ? String(w.company_id) : '-')} |`,
    `| URL | ${esc(w.url) || '-'} |`,
    `| HTTP Code | ${w.code ?? '-'} |`,
    `| Status | ${esc(w.status) || '-'} |`,
    `| Monitoramento | ${esc(w.monitoring_status) || '-'} |`,
    `| Pausado | ${w.paused ? 'Sim' : 'Não'} |`,
    `| Monitor DNS | ${w.disable_dns ? 'Desativado' : 'Ativado'} |`,
    `| Monitor SSL | ${w.disable_ssl ? 'Desativado' : 'Ativado'} |`,
    `| Monitor WHOIS | ${w.disable_whois ? 'Desativado' : 'Ativado'} |`,
    `| Rastreio DMARC | ${w.enable_dmarc_tracking ? 'Ativado' : 'Desativado'} |`,
    `| Rastreio DKIM | ${w.enable_dkim_tracking ? 'Ativado' : 'Desativado'} |`,
    `| Rastreio SPF | ${w.enable_spf_tracking ? 'Ativado' : 'Desativado'} |`,
    `| Última verificação | ${w.refreshed_at ?? '-'} |`,
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

// ---- Folder detail ----

export function formatFolderDetail(f: any): string {
  if (!f || typeof f !== 'object') return 'Pasta indisponível.';
  return [
    `# Pasta: ${esc(f.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${f.id ?? '-'} |`,
    `| Empresa ID | ${f.company_id ?? 'Global'} |`,
    `| Pasta pai | ${f.parent_folder_id ?? '-'} |`,
    `| Ícone | ${esc(f.icon) || '-'} |`,
    `| Criada em | ${f.created_at ?? '-'} |`,
    `| Atualizada em | ${f.updated_at ?? '-'} |`,
    ...(f.description ? ['', '## Descrição', '', truncate(f.description, 1000)] : []),
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

export function formatRelationDetail(r: HuduRelation): string {
  return [
    `# Relacao: ${esc(r.name) || `${esc(r.fromable_type)}#${r.fromable_id} -> ${esc(r.toable_type)}#${r.toable_id}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${r.id} |`,
    `| Nome | ${esc(r.name) || '-'} |`,
    `| Origem | ${esc(r.fromable_type)}#${r.fromable_id} |`,
    `| Destino | ${esc(r.toable_type)}#${r.toable_id} |`,
    `| Criado em | ${r.created_at ?? ''} |`,
    `| Atualizado em | ${r.updated_at ?? ''} |`,
    ...(r.description ? ['', '## Descricao', '', truncate(r.description, 2000)] : []),
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
    `| Pasta ID | ${p.folder_id ?? '-'} |`,
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

export function formatNetworkDetail(n: HuduNetwork): string {
  if (!n || typeof n !== 'object') return 'Rede indisponível.';
  return [
    `# Rede: ${esc(n.name) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${n.id ?? '-'} |`,
    `| Endereço | ${esc(n.address || n.network) || '-'} |`,
    `| Tipo | ${n.network_type ?? '-'} |`,
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

export function formatIpAddressDetail(ip: any): string {
  if (!ip || typeof ip !== 'object') return 'Endereço IP indisponível.';
  return [
    `# Endereço IP: ${esc(ip.address) || '-'}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${ip.id ?? '-'} |`,
    `| FQDN | ${esc(ip.fqdn) || '-'} |`,
    `| Status | ${esc(ip.status) || '-'} |`,
    `| Rede ID | ${ip.network_id ?? '-'} |`,
    `| Empresa ID | ${ip.company_id ?? '-'} |`,
    `| Ativo ID | ${ip.asset_id ?? '-'} |`,
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

export function formatPublicPhotoDetail(p: any): string {
  if (!p || typeof p !== 'object') return 'Foto indisponível.';
  return [
    `# Foto pública: ${esc(p.name) || esc(p.filename) || `#${p.id}`}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| ID | ${p.id ?? '-'} |`,
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

export function formatProcedureTaskList(paged: HuduPagedResponse<any>): string {
  if (paged.records.length === 0) return 'Nenhuma tarefa de procedimento encontrada.';

  const rows = paged.records.map(
    (t) =>
      `| ${t.id} | ${esc(t.name) || '-'} | ${t.procedure_id ?? '-'} | ${t.position ?? '-'} | ${t.completed ? 'Concluída' : 'Pendente'} |`
  );

  return [
    pageInfo(paged),
    '',
    '| ID | Nome | Procedimento ID | Posição | Status |',
    '|---|---|---|---|---|',
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
    `| Criada em | ${t.created_at ?? '-'} |`,
    `| Atualizada em | ${t.updated_at ?? '-'} |`,
    ...(t.description ? ['', '## Descrição', '', truncate(t.description, 2000)] : []),
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
