/**
 * BUG-14 — the error channel carried whatever the API said, unfiltered
 *
 * `describeApiError` folded the API's error body into `error.message`, which
 * reaches the winston DailyRotateFile on disk AND the LLM's context. The repo
 * masks secrets on every success path and had nothing on this one.
 *
 * These cases are the shapes an audit demonstrated against the built client.
 */

import { redactSensitive, redactPayload, MASK, MAX_ERROR_CHARS } from '../../utils/redact.js';

/**
 * Every value below is synthetic and says so in the value itself. This is a
 * PUBLIC repository with secret scanning in CI: a realistic-looking fixture
 * costs a triage every time somebody scans, and a fixture that reads as fake
 * costs nothing while exercising the same code path.
 */

describe('BUG-14 — redactSensitive', () => {
  it('masks a key echoed back by an auth failure', () => {
    const out = redactSensitive('invalid api_key: hudu_live_exemploFALSO1234naoEhChave');
    expect(out).not.toContain('hudu_live_exemploFALSO1234naoEhChave');
    expect(out).toContain(MASK);
    expect(out).toContain('invalid api_key'); // the actionable part survives
  });

  it('masks a password quoted inside a uniqueness error', () => {
    const out = redactSensitive('Password "SenhaDeExemplo!2026" has already been taken by asset 91');
    expect(out).not.toContain('SenhaDeExemplo!2026');
    expect(out).toContain('has already been taken by asset 91');
  });

  it('masks pt-BR labels too', () => {
    expect(redactSensitive('senha: SenhaFALSAdeExemplo123')).not.toContain('SenhaFALSAdeExemplo123');
  });

  it('masks a bearer token and an otp secret', () => {
    expect(redactSensitive('Authorization: Bearer exemploDeTokenFALSO1234567890abc')).not.toContain('exemploDeTokenFALSO1234567890abc');
    // Low entropy on purpose: `otp_secret=<algo>` is a shape secret scanners
    // match on, and a fixture that trips CI forever costs more than it proves.
    expect(redactSensitive('otp_secret=exemplo-falso-de-otp')).not.toContain('exemplo-falso-de-otp');
  });

  it('masks a bare high-entropy run with no label', () => {
    expect(redactSensitive('unexpected value sk-exemploFALSOnaoEhChaveReal99')).toContain(MASK);
  });

  it('leaves ordinary API guidance intact — the message has to stay useful', () => {
    const msg = 'Validation failed — Color must be one of: Red, Blue, Green, Yellow, Purple';
    expect(redactSensitive(msg)).toBe(msg);
  });

  it('does not mask long ordinary identifiers', () => {
    for (const s of [
      'create_from_template is not a valid action',
      'Name has already been taken',
      'updated_at 2026-08-27T15:45:47.981Z is invalid',
    ]) {
      expect(redactSensitive(s)).toBe(s);
    }
  });

  it('collapses newlines so one error stays one line', () => {
    expect(redactSensitive('linha um\nlinha dois')).toBe('linha um linha dois');
  });

  it('caps length', () => {
    const out = redactSensitive('a'.repeat(2000));
    expect(out.length).toBeLessThanOrEqual(MAX_ERROR_CHARS);
    expect(out.endsWith('…')).toBe(true);
  });

  it('handles empty input', () => {
    expect(redactSensitive('')).toBe('');
  });
});

/**
 * BUG-21 — the first version failed in both directions at once
 *
 * An adversarial audit showed it erasing the actionable half of the commonest
 * API errors (because a trigger word followed by ANY word was masked) while
 * letting a labelled secret through (because `chave` was not a trigger word and
 * the value was under the length floor). Both are covered here, with the
 * over-masking cases asserting the string is returned UNCHANGED — the previous
 * test asserted a property using inputs that could not exhibit the failure.
 */
describe('BUG-21 — redaction keeps the message usable', () => {
  it.each([
    'HTTP 401: Your token expired at 2026-01-01',
    'HTTP 401: api_key is invalid',
    'HTTP 401: Authorization header missing',
    'HTTP 422: password is too short (minimum is 8 characters)',
    'HTTP 422: Password must include a number',
    'HTTP 404: token 12345 not found',
    'HTTP 422: A senha nao pode ficar em branco',
    'Validation failed — Color must be one of: Red, Blue, Green, Yellow',
  ])('leaves prose intact: %s', (msg) => {
    expect(redactSensitive(msg)).toBe(msg);
  });

  it('does not erase the asset name out of a duplicate-name error', () => {
    // The one message that says WHICH name collided. A high-entropy heuristic
    // masked it, leaving the caller unable to act.
    const msg = 'HTTP 422: Name Servidor_De_Backup_Principal_2026 has already been taken';
    expect(redactSensitive(msg)).toBe(msg);
  });

  it.each([
    ['HTTP 401: chave de API invalida: hu_exemploFalso1234', 'hu_exemploFalso1234'], // gitleaks:allow — valor sintetico; esta suite existe para provar que ele e mascarado
    ['HTTP 401: credencial=valor-falso-de-exemplo', 'valor-falso-de-exemplo'],
    ['Authorization: Bearer abc123def456', 'abc123def456'],
    // gitleaks:allow — a JWT-shaped string built from the word "exemplo"
    ['x eyJexemploFALSO.eyJnaoEhTokenReal.assinaturaFalsa', 'eyJexemploFALSO'],
  ])('masks a labelled or prefixed secret: %s', (msg, secret) => {
    const out = redactSensitive(msg);
    expect(out).not.toContain(secret);
    expect(out).toContain(MASK);
  });
});

describe('BUG-21 — logged payloads', () => {
  it('blanks a password before it reaches the log file', () => {
    const out = redactPayload({
      action: 'create',
      fields: { name: 'db prod', username: 'admin', password: 'S3nh4Real!' },
    }) as any;
    expect(out.fields.password).toBe(MASK);
    expect(out.fields.username).toBe('admin');
    expect(out.fields.name).toBe('db prod');
    expect(JSON.stringify(out)).not.toContain('S3nh4Real');
  });

  it('reaches secrets nested in arrays', () => {
    const out = redactPayload({ items: [{ token: 'abc' }, { name: 'ok' }] }) as any;
    expect(out.items[0].token).toBe(MASK);
    expect(out.items[1].name).toBe('ok');
  });

  it('leaves a payload with nothing sensitive alone', () => {
    const input = { action: 'get', id: 3, fields: { name: 'x' } };
    expect(redactPayload(input)).toEqual(input);
  });

  it('does not choke on null, undefined or a cycle-free deep object', () => {
    expect(redactPayload(null)).toBeNull();
    expect(redactPayload(undefined)).toBeUndefined();
    expect(redactPayload({ a: { b: { c: { d: { e: { f: { g: 1 } } } } } } })).toBeTruthy();
  });
});
