/**
 * BUG-14 — the error channel carried whatever the API said, unfiltered
 *
 * `describeApiError` folded the API's error body into `error.message`, which
 * reaches the winston DailyRotateFile on disk AND the LLM's context. The repo
 * masks secrets on every success path and had nothing on this one.
 *
 * These cases are the shapes an audit demonstrated against the built client.
 */

import { redactSensitive, MASK, MAX_ERROR_CHARS } from '../../utils/redact.js';

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
