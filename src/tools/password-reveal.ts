import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createErrorResponse, createSuccessResponse, type ToolResponse } from './base.js';
import { escapeMarkdown as esc } from '../utils/html-stripper.js';
import { generateTotp, InvalidOtpSecretError } from '../utils/totp.js';

/**
 * REQ-20 — the ONE path that returns a password in plain text.
 *
 * Every other path masks: `hudu_search_password_credentials` has no password
 * column, `hudu_search_all_resource_types` blanks it, and
 * `hudu_manage_password_credentials action=get` renders `****`. That is right
 * for discovery, and it left no way for the model to USE a stored credential
 * (log in somewhere on the operator's behalf). This tool closes that gap with
 * four constraints:
 *
 *   1. Exactly one record, by id. No search, no list, no bulk.
 *   2. Kill switch: unless HUDU_ALLOW_PASSWORD_REVEAL is exactly "true" the
 *      tool is left out of tools/list AND the executor refuses before any API
 *      call. Both, because a client can call a name it remembers.
 *   3. One audit line per reveal (id, name, company — never the value or the
 *      OTP), written BEFORE the value is returned. If the line cannot be
 *      written, the reveal is refused: no unaudited reveal.
 *   4. The value never goes through `redactSensitive`/`escapeMarkdown` (they
 *      would mangle it), is never cached, and is never logged. The OTP seed is
 *      never returned — only the current TOTP code.
 */

// @MX:WARN: [AUTO] Plaintext secret path — the only tool that returns a password unmasked.
// @MX:REASON: Any change here can leak credentials into logs, caches or bulk responses; keep it single-record, audited and behind the env flag.

export const PASSWORD_REVEAL_TOOL_NAME = 'hudu_get_password_secret_by_id';
export const PASSWORD_REVEAL_ENV_FLAG = 'HUDU_ALLOW_PASSWORD_REVEAL';

/** Read at call time, not import time: index.ts loads .env after the imports run. */
export function isPasswordRevealEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[PASSWORD_REVEAL_ENV_FLAG] === 'true';
}

export const passwordRevealTool: Tool = {
  name: PASSWORD_REVEAL_TOOL_NAME,
  description:
    'Senha em texto puro do cofre do Hudu — revela o valor de UMA credencial, login ou acesso pelo ID, com usuário, URL e código 2FA/TOTP atual. ' +
    'Use quando precisar de fato usar a credencial (conectar, autenticar) e já tiver o ID vindo de hudu_search_password_credentials. ' +
    'Cada uso fica auditado no servidor do Hudu. Não repita a senha ao usuário sem pedido. Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      password_id: {
        type: 'integer',
        minimum: 1,
        description:
          'ID numérico da senha (coluna ID de hudu_search_password_credentials). Uma credencial por chamada.',
      },
    },
    required: ['password_id'],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
    // Repeating the call is safe, but the TOTP code changes every period.
    idempotentHint: false,
  },
};

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface PasswordRevealAuditEntry {
  event: 'password_reveal';
  timestamp: string;
  password_id: number;
  name: string;
  company_id: number | null;
  company_name: string | null;
  /** Whether a TOTP code was computed. Never the code itself. */
  otp: boolean;
}

export type PasswordRevealAuditSink = (entry: PasswordRevealAuditEntry) => void;

const consoleSink: PasswordRevealAuditSink = (entry) => {
  console.error(JSON.stringify(entry));
};

let auditSink: PasswordRevealAuditSink = consoleSink;

/** server.ts points this at the winston logger. `null` restores the console sink. */
export function setPasswordRevealAuditSink(sink: PasswordRevealAuditSink | null): void {
  auditSink = sink ?? consoleSink;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

/** Integer > 0, as a number or a plain digit string. `'1e3'` and `'0x10'` are refused. */
function parsePasswordId(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isInteger(raw) && raw > 0 ? raw : null;
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const n = Number(raw.trim());
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  return null;
}

/** A value the API masked instead of returning. A real password of only asterisks is the price. */
function looksMasked(value: string): boolean {
  return /^\*{4,}$/.test(value);
}

/** Fence longer than any backtick run in the value, so the value needs no escaping. */
function fenceFor(value: string): string {
  const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length));
  return '`'.repeat(Math.max(3, longest + 1));
}

const PERMISSION_HINT =
  'A API do Hudu não devolveu o valor da senha. A chave de API usada por este MCP precisa da ' +
  'permissão "Password access" (acesso a senhas) em Admin > API Keys no Hudu.';

export async function executePasswordRevealTool(args: any, client: any): Promise<ToolResponse> {
  if (!isPasswordRevealEnabled()) {
    return createErrorResponse(
      `Revelação de senha desativada neste servidor (${PASSWORD_REVEAL_ENV_FLAG} não é "true"). ` +
        'Peça ao administrador do MCP Hudu para habilitar, ou consulte a senha na interface do Hudu.'
    );
  }

  const id = parsePasswordId(args?.password_id);
  if (id === null) {
    return createErrorResponse(
      'password_id deve ser um inteiro positivo (coluna ID de hudu_search_password_credentials).'
    );
  }

  let record: any;
  try {
    record = await client.getAssetPassword(id);
  } catch (error: any) {
    // The client's interceptor already redacted the API body.
    return createErrorResponse(`Falha ao obter a senha ${id} no Hudu: ${error?.message ?? 'erro desconhecido'}`);
  }
  if (!record || typeof record !== 'object') {
    return createErrorResponse(`Senha ${id} não encontrada no Hudu.`);
  }

  // HUDU_ALLOWED_COMPANY_IDS: FilteredHuduClient.getAssetPassword does not
  // check the company of a single record, so the reveal does.
  if (typeof client.isCompanyAllowed === 'function' && !client.isCompanyAllowed(record.company_id)) {
    return createErrorResponse(
      `Senha ${id} pertence a uma empresa fora de HUDU_ALLOWED_COMPANY_IDS deste servidor; revelação recusada.`
    );
  }

  const value: unknown = record.password;
  if (typeof value !== 'string' || looksMasked(value)) {
    return createErrorResponse(PERMISSION_HINT);
  }

  // TOTP is computed before the audit line so the line can say whether one
  // was produced; the seed and the code stay in local variables only.
  const otpSecret = typeof record.otp_secret === 'string' ? record.otp_secret.trim() : '';
  let totpBlock: string[] = [];
  let otpComputed = false;
  if (otpSecret) {
    try {
      const totp = generateTotp(otpSecret, Date.now());
      otpComputed = true;
      const s = totp.secondsRemaining;
      totpBlock = [
        '',
        '## Código 2FA (TOTP)',
        '',
        '| Campo | Valor |',
        '|---|---|',
        `| Código atual | ${totp.code} |`,
        `| Válido por mais | ${s} ${s === 1 ? 'segundo' : 'segundos'} |`,
        '',
        'Se o código expirar antes do uso, chame esta tool de novo.',
      ];
    } catch (error) {
      const reason = error instanceof InvalidOtpSecretError ? error.message : 'segredo OTP inutilizável';
      totpBlock = ['', `> Há um segredo OTP cadastrado, mas não foi possível gerar o código TOTP (${reason}).`];
    }
  }

  const companyId: number | null = typeof record.company_id === 'number' ? record.company_id : null;
  const companyName: string | null = record.company_name ? String(record.company_name) : null;
  const name = String(record.name ?? '');

  try {
    auditSink({
      event: 'password_reveal',
      timestamp: new Date().toISOString(),
      password_id: id,
      name,
      company_id: companyId,
      company_name: companyName,
      otp: otpComputed,
    });
  } catch (error: any) {
    // Fail closed. The sink's own message cannot carry the value: the sink
    // never received it.
    console.error(`password_reveal audit failed for id=${id}: ${error?.message ?? 'unknown'}`);
    return createErrorResponse(
      `Não foi possível registrar a auditoria da revelação da senha ${id}; por segurança o valor não foi devolvido.`
    );
  }

  const company = companyName
    ? `${esc(companyName)}${companyId !== null ? ` (ID: ${companyId})` : ''}`
    : companyId !== null
      ? String(companyId)
      : '-';

  const rows = [
    `| ID | ${id} |`,
    `| Nome | ${esc(name) || '-'} |`,
    `| Empresa | ${company} |`,
    `| Usuário | ${esc(record.username) || '-'} |`,
    // The API's `url` is the record's own page in Hudu; the service the
    // credential opens is `login_url` (what the create form calls URL).
    `| URL de acesso | ${esc(record.login_url) || '-'} |`,
    `| Registro no Hudu | ${esc(record.url) || '-'} |`,
  ];
  if (record.password_folder_name) rows.push(`| Pasta | ${esc(record.password_folder_name)} |`);

  const secretBlock =
    value === ''
      ? ['## Senha', '', 'Esta credencial não tem senha cadastrada no Hudu (campo vazio).']
      : (() => {
          const fence = fenceFor(value);
          return [
            `## Senha (${value.length} caracteres)`,
            '',
            fence,
            value,
            fence,
            '',
            'O valor é exatamente a linha entre as cercas, sem escapes (espaços no início ou no fim fazem parte).',
          ];
        })();

  const markdown = [
    `# Senha revelada: ${esc(name)}`,
    '',
    '| Campo | Valor |',
    '|---|---|',
    ...rows,
    '',
    ...secretBlock,
    ...totpBlock,
    '',
    '> Revelação registrada em auditoria. Use a credencial para a tarefa; não repita a senha ao usuário a menos que ele peça.',
  ].join('\n');

  return createSuccessResponse(markdown);
}
