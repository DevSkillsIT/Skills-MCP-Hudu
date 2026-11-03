/**
 * REQ-20 — Reveal ONE password, in plain text, by id.
 *
 * Every other path masks secrets (search, global search, manage action=get).
 * That left an operator with no way to let the model actually USE a
 * credential stored in Hudu. This adds one dedicated tool,
 * `hudu_get_password_secret_by_id`, behind an env kill switch, with an audit
 * line per reveal that never carries the value.
 *
 * What these tests pin:
 *   1. TOTP matches the RFC 6238 SHA-1 vectors.
 *   2. Flag on  -> the exact plaintext comes back (fenced, unescaped).
 *   3. Flag off -> the tool is not listed AND the executor refuses without
 *      touching the API.
 *   4. Search, global search and manage action=get stay masked.
 *   5. The audit entry and anything written to the console never carry the
 *      password or the OTP secret/code.
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateTotp, InvalidOtpSecretError } from '../utils/totp.js';
import {
  PASSWORD_REVEAL_TOOL_NAME,
  PASSWORD_REVEAL_ENV_FLAG,
  isPasswordRevealEnabled,
  passwordRevealTool,
  executePasswordRevealTool,
  setPasswordRevealAuditSink,
  type PasswordRevealAuditEntry,
} from '../tools/password-reveal.js';
import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS, listActiveTools } from '../tools/working-index.js';
import { executePasswordsQueryTool, executePasswordsTool, passwordsQueryTool } from '../tools/passwords.js';
import { getHuduPromptText } from '../prompts.js';
import { executeSearchTool } from '../tools/search.js';
import { formatToolResponse } from '../formatters/response-formatter.js';
import { FilteredHuduClient } from '../filtered-hudu-client.js';
import type { HuduClient } from '../hudu-client.js';

// RFC 6238 appendix B: the SHA-1 seed is the ASCII string "12345678901234567890".
const RFC_SECRET_B32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

// A value built to break every naive renderer: pipe (table cell), backticks
// (inline code), asterisks (emphasis), a leading space and a `=` (redact rule).
const SECRET = ' p|a`ss**w=rd``9';

const PASSWORD_RECORD = {
  id: 77,
  name: 'Firewall admin',
  username: 'admin',
  password: SECRET,
  url: 'https://hudu.example.test/passwords/abc123',
  login_url: 'https://fw.example.test',
  company_id: 12,
  company_name: 'Empresa Exemplo',
  otp_secret: '',
  in_portal: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-02',
};

const fn = <T = any>(value?: T) => jest.fn<() => Promise<T | undefined>>().mockResolvedValue(value);

const clientWith = (record: any = PASSWORD_RECORD) =>
  ({
    getAssetPassword: fn(record),
    getAssetPasswords: fn([record]),
    getArticles: fn([]),
    getAssets: fn([]),
    getCompanies: fn([]),
  }) as unknown as HuduClient;

function flagOn(): void {
  process.env[PASSWORD_REVEAL_ENV_FLAG] = 'true';
}
function flagOff(): void {
  delete process.env[PASSWORD_REVEAL_ENV_FLAG];
}

let audit: PasswordRevealAuditEntry[];
let consoleText: string;
let spies: Array<{ mockRestore: () => void }>;

beforeEach(() => {
  audit = [];
  setPasswordRevealAuditSink((e) => audit.push(e));
  consoleText = '';
  const capture = (...a: unknown[]) => {
    consoleText += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n';
  };
  spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
    jest.spyOn(console, m).mockImplementation(capture)
  );
});

afterEach(() => {
  flagOff();
  setPasswordRevealAuditSink(null);
  spies.forEach((s) => s.mockRestore());
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
describe('generateTotp — RFC 6238 SHA-1 vectors', () => {
  test.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ])('T=%i -> %s (8 digits)', (t, expected) => {
    const otpauth = `otpauth://totp/x?secret=${RFC_SECRET_B32}&digits=8`;
    expect(generateTotp(otpauth, t * 1000).code).toBe(expected);
  });

  test('6-digit code is the low 6 digits of the same HOTP value', () => {
    expect(generateTotp(RFC_SECRET_B32, 59_000).code).toBe('287082');
    expect(generateTotp(RFC_SECRET_B32, 1_234_567_890_000).code).toBe('005924');
  });

  test('secondsRemaining counts down to the next 30 s step', () => {
    expect(generateTotp(RFC_SECRET_B32, 59_000).secondsRemaining).toBe(1);
    expect(generateTotp(RFC_SECRET_B32, 60_000).secondsRemaining).toBe(30);
    expect(generateTotp(RFC_SECRET_B32, 75_500).secondsRemaining).toBe(15);
  });

  test('tolerates lowercase, spaces and padding the way authenticator apps do', () => {
    const messy = 'gezd gnbv gy3t qojq gezd gnbv gy3t qojq==';
    expect(generateTotp(messy, 59_000).code).toBe('287082');
  });

  test('rejects a secret that is not base32', () => {
    expect(() => generateTotp('not-base32-1!', 59_000)).toThrow(InvalidOtpSecretError);
    expect(() => generateTotp('', 59_000)).toThrow(InvalidOtpSecretError);
  });

  test('the error message never quotes the secret', () => {
    try {
      generateTotp('SECRET-VALUE-189', 0);
    } catch (e: any) {
      expect(e.message).not.toContain('SECRET-VALUE-189');
    }
  });
});

// ---------------------------------------------------------------------------
describe('kill switch', () => {
  test(`${PASSWORD_REVEAL_ENV_FLAG} must be exactly "true"`, () => {
    expect(isPasswordRevealEnabled({})).toBe(false);
    expect(isPasswordRevealEnabled({ [PASSWORD_REVEAL_ENV_FLAG]: 'false' })).toBe(false);
    expect(isPasswordRevealEnabled({ [PASSWORD_REVEAL_ENV_FLAG]: '1' })).toBe(false);
    expect(isPasswordRevealEnabled({ [PASSWORD_REVEAL_ENV_FLAG]: 'TRUE' })).toBe(false);
    expect(isPasswordRevealEnabled({ [PASSWORD_REVEAL_ENV_FLAG]: 'true' })).toBe(true);
  });

  test('flag off: tool is NOT listed', () => {
    flagOff();
    expect(listActiveTools().map((t) => t.name)).not.toContain(PASSWORD_REVEAL_TOOL_NAME);
  });

  test('flag on: tool IS listed, and every other tool is listed either way', () => {
    flagOff();
    const off = listActiveTools().map((t) => t.name);
    flagOn();
    const on = listActiveTools().map((t) => t.name);
    expect(on).toContain(PASSWORD_REVEAL_TOOL_NAME);
    expect(on.filter((n) => n !== PASSWORD_REVEAL_TOOL_NAME).sort()).toEqual([...off].sort());
    expect(on.length).toBe(Object.keys(WORKING_TOOLS).length);
  });

  test('flag off: executor refuses and never calls the API', async () => {
    flagOff();
    const client = clientWith();
    const res = await executePasswordRevealTool({ password_id: 77 }, client);
    expect(res.success).toBe(false);
    expect(res.error).toContain(PASSWORD_REVEAL_ENV_FLAG);
    expect(client.getAssetPassword).not.toHaveBeenCalled();
    expect(audit).toHaveLength(0);
  });

  test('the executor is wired in the registry under the tool name', () => {
    expect(WORKING_TOOLS[PASSWORD_REVEAL_TOOL_NAME]).toBe(passwordRevealTool);
    expect(WORKING_TOOL_EXECUTORS[PASSWORD_REVEAL_TOOL_NAME]).toBe(executePasswordRevealTool);
  });
});

// ---------------------------------------------------------------------------
describe('tool contract (DIRETRIZES phases 2-4, MELHORES-PRATICAS 5)', () => {
  test('name has the hudu_ prefix and 25-64 chars', () => {
    expect(passwordRevealTool.name).toBe('hudu_get_password_secret_by_id');
    expect(passwordRevealTool.name.length).toBeGreaterThanOrEqual(25);
    expect(passwordRevealTool.name.length).toBeLessThanOrEqual(64);
  });

  test('description is pt-BR, 280-400 chars, names Hudu at least twice', () => {
    const d = passwordRevealTool.description ?? '';
    expect(d.length).toBeGreaterThanOrEqual(280);
    expect(d.length).toBeLessThanOrEqual(400);
    expect(d.match(/Hudu/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(d).toMatch(/^Senha/);
  });

  test('annotations: read-only, non-destructive, open world', () => {
    expect(passwordRevealTool.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    });
  });

  test('one required integer parameter, password_id, and nothing that could bulk-list', () => {
    const schema = passwordRevealTool.inputSchema as any;
    expect(Object.keys(schema.properties)).toEqual(['password_id']);
    expect(schema.properties.password_id.type).toBe('integer');
    expect(schema.required).toEqual(['password_id']);
    expect(schema.additionalProperties).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('flag on: reveal', () => {
  beforeEach(flagOn);

  test('returns the exact plaintext, plus name, company, username and URL', async () => {
    const client = clientWith();
    const res = await executePasswordRevealTool({ password_id: 77 }, client);
    expect(res.success).toBe(true);
    const md = formatToolResponse(PASSWORD_REVEAL_TOOL_NAME, res.data, { password_id: 77 });

    expect(client.getAssetPassword).toHaveBeenCalledWith(77);
    expect(md).toContain('Firewall admin');
    expect(md).toContain('Empresa Exemplo');
    expect(md).toContain('admin');
    expect(md).toContain('| URL de acesso | https://fw.example.test |');
    expect(md).toContain('| Registro no Hudu | https://hudu.example.test/passwords/abc123 |');
    expect(md).not.toContain('****');

    // The value sits alone on a line inside a fence longer than any backtick
    // run in it, so nothing is escaped and nothing is lost.
    const lines = md.split('\n');
    const fenceIdx = lines.findIndex((l) => /^`{3,}$/.test(l));
    expect(fenceIdx).toBeGreaterThan(-1);
    expect(lines[fenceIdx + 1]).toBe(SECRET);
    expect(lines[fenceIdx + 2]).toBe(lines[fenceIdx]);
    expect(lines[fenceIdx]!.length).toBeGreaterThan(2);
    expect(md).toContain(`${SECRET.length} caracteres`);
  });

  test('accepts a numeric string id (what some clients send)', async () => {
    const client = clientWith();
    const res = await executePasswordRevealTool({ password_id: '77' }, client);
    expect(res.success).toBe(true);
    expect(client.getAssetPassword).toHaveBeenCalledWith(77);
  });

  test.each([[undefined], [0], [-3], [1.5], ['abc'], ['1e3']])(
    'rejects invalid password_id %p without calling the API',
    async (bad) => {
      const client = clientWith();
      const res = await executePasswordRevealTool({ password_id: bad }, client);
      expect(res.success).toBe(false);
      expect(client.getAssetPassword).not.toHaveBeenCalled();
    }
  );

  test('with an OTP secret: current TOTP code and seconds remaining, never the raw secret', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(59_000);
    const client = clientWith({ ...PASSWORD_RECORD, otp_secret: RFC_SECRET_B32 });
    const res = await executePasswordRevealTool({ password_id: 77 }, client);
    const md = formatToolResponse(PASSWORD_REVEAL_TOOL_NAME, res.data, {});
    expect(md).toContain('287082');
    expect(md).toMatch(/1 segundo/);
    expect(md).not.toContain(RFC_SECRET_B32);
  });

  test('with an invalid OTP secret: says so, still returns the password, never quotes it', async () => {
    const client = clientWith({ ...PASSWORD_RECORD, otp_secret: 'zz-not-base32!' });
    const res = await executePasswordRevealTool({ password_id: 77 }, client);
    expect(res.success).toBe(true);
    const md = String(res.data);
    expect(md).toContain(SECRET);
    expect(md).not.toContain('zz-not-base32!');
    expect(md).toMatch(/OTP/);
  });

  test('without an OTP secret: no 2FA section', async () => {
    const res = await executePasswordRevealTool({ password_id: 77 }, clientWith());
    expect(String(res.data)).not.toMatch(/TOTP/);
  });

  test('masked value from the API: refuses and names the Hudu permission', async () => {
    const client = clientWith({ ...PASSWORD_RECORD, password: '********' });
    const res = await executePasswordRevealTool({ password_id: 77 }, client);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/password access|acesso a senhas/i);
    expect(audit).toHaveLength(0);
  });

  test('missing value from the API: refuses the same way', async () => {
    const { password: _drop, ...noValue } = PASSWORD_RECORD;
    const res = await executePasswordRevealTool({ password_id: 77 }, clientWith(noValue));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/password access|acesso a senhas/i);
  });

  test('API failure surfaces as an error, no audit line', async () => {
    const client = {
      getAssetPassword: jest.fn<() => Promise<never>>().mockRejectedValue(new Error('HTTP 404: not found')),
    } as unknown as HuduClient;
    const res = await executePasswordRevealTool({ password_id: 9 }, client);
    expect(res.success).toBe(false);
    expect(res.error).toContain('404');
    expect(audit).toHaveLength(0);
  });

  test('company allowlist: a FilteredHuduClient refuses a company outside the list', async () => {
    const inner = clientWith({ ...PASSWORD_RECORD, company_id: 999 });
    const filtered = new FilteredHuduClient(inner, ['12']);
    const res = await executePasswordRevealTool({ password_id: 77 }, filtered);
    expect(res.success).toBe(false);
    expect(String(res.error)).not.toContain(SECRET);
    expect(audit).toHaveLength(0);
  });

  test('company allowlist: an allowed company passes', async () => {
    const filtered = new FilteredHuduClient(clientWith(), ['12']);
    const res = await executePasswordRevealTool({ password_id: 77 }, filtered);
    expect(res.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('audit', () => {
  beforeEach(flagOn);

  test('one entry per reveal with id, name and company — never the value or OTP', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(59_000);
    const client = clientWith({ ...PASSWORD_RECORD, otp_secret: RFC_SECRET_B32 });
    await executePasswordRevealTool({ password_id: 77 }, client);

    expect(audit).toHaveLength(1);
    const entry = audit[0]!;
    expect(entry).toMatchObject({
      event: 'password_reveal',
      password_id: 77,
      name: 'Firewall admin',
      company_id: 12,
      company_name: 'Empresa Exemplo',
      otp: true,
    });
    expect(typeof entry.timestamp).toBe('string');

    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain('p|a');
    expect(serialized).not.toContain(RFC_SECRET_B32);
    expect(serialized).not.toContain('287082');
  });

  test('nothing written to the console carries the value or the OTP', async () => {
    setPasswordRevealAuditSink(null); // default sink writes to the console
    jest.spyOn(Date, 'now').mockReturnValue(59_000);
    const client = clientWith({ ...PASSWORD_RECORD, otp_secret: RFC_SECRET_B32 });
    await executePasswordRevealTool({ password_id: 77 }, client);
    expect(consoleText).toContain('password_reveal');
    expect(consoleText).not.toContain('p|a');
    expect(consoleText).not.toContain(RFC_SECRET_B32);
    expect(consoleText).not.toContain('287082');
  });

  test('a failing audit sink fails CLOSED: no unaudited reveal, nothing leaked', async () => {
    setPasswordRevealAuditSink(() => {
      throw new Error('disk full');
    });
    const res = await executePasswordRevealTool({ password_id: 77 }, clientWith());
    expect(res.success).toBe(false);
    expect(JSON.stringify(res)).not.toContain('p|a');
    expect(consoleText).not.toContain('p|a');
  });
});

// ---------------------------------------------------------------------------
describe('guidance the model reads', () => {
  test('search description says it is masked and points to the reveal tool, within 280-400', () => {
    const d = passwordsQueryTool.description ?? '';
    expect(d).toContain(PASSWORD_REVEAL_TOOL_NAME);
    expect(d.length).toBeGreaterThanOrEqual(280);
    expect(d.length).toBeLessThanOrEqual(400);
  });

  test('hudu_password_lookup prompt no longer claims values are always masked', () => {
    const text = JSON.stringify(getHuduPromptText('hudu_password_lookup', { search_term: 'vpn' }));
    expect(text).toContain(PASSWORD_REVEAL_TOOL_NAME);
    expect(text).not.toMatch(/sempre mascarados na API/);
  });
});

// ---------------------------------------------------------------------------
describe('everything else stays masked, with the flag ON', () => {
  beforeEach(flagOn);

  test('hudu_search_password_credentials has no password column', async () => {
    const res = await executePasswordsQueryTool({ search: 'fire' }, clientWith());
    const md = formatToolResponse('hudu_search_password_credentials', res.data, {});
    expect(md).toContain('Firewall admin');
    expect(md).not.toContain('p|a');
    expect(md).not.toContain('p\\|a');
  });

  test('hudu_manage_password_credentials action=get still renders ****', async () => {
    const res = await executePasswordsTool({ action: 'get', id: 77 }, clientWith());
    const md = formatToolResponse('hudu_manage_password_credentials', res.data, {});
    expect(md).toContain('| Senha | **** |');
    expect(md).not.toContain('p|a');
    expect(md).not.toContain('p\\|a');
  });

  test('hudu_search_all_resource_types masks the password and drops otp_secret', async () => {
    const client = clientWith({ ...PASSWORD_RECORD, otp_secret: RFC_SECRET_B32 });
    const res = await executeSearchTool({ query: 'fire', type: 'passwords' }, client);
    const md = formatToolResponse('hudu_search_all_resource_types', res.data, {});
    const raw = JSON.stringify(res.data);
    expect(raw).not.toContain('p|a');
    expect(raw).not.toContain(RFC_SECRET_B32);
    expect(md).not.toContain('p|a');
  });
});

// ---------------------------------------------------------------------------
// Found live: for an id that does not exist (e.g. just deleted) Hudu answers
// `200 null`, and getAssetPassword crashed with "Cannot read properties of
// null (reading 'asset_password')" — in the reveal AND in manage action=get.
describe('HuduClient.getAssetPassword on a missing id', () => {
  test('says the password was not found instead of a TypeError', async () => {
    const { HuduClient } = await import('../hudu-client.js');
    const c = new HuduClient({ baseUrl: 'https://hudu.example.test', apiKey: 'x', timeout: 1000 });
    (c as any).client = { get: async () => ({ data: null }) };
    await expect(c.getAssetPassword(366)).rejects.toThrow(/366.*não encontrada/);
  });
});
