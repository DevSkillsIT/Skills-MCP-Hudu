/**
 * BUG-12 — two findings from live validation against Hudu 2.44.3 (2026-08-27)
 *
 * 1. Flag colours are a fixed palette of NAMES, not hex. Labels take hex
 *    (`HEX_COLOR_REGEX` on LabelType); flags validate inclusion in
 *    `FlagType::ALLOWED_COLORS`. Sending "#654321" — the obvious guess after
 *    working with labels — is a 422.
 *
 * 2. The API says exactly why it refused:
 *      {"error":"Validation failed","details":["Color must be one of: Red, ..."]}
 *    Axios throws with `message = "Request failed with status code 422"` and
 *    the body only on `error.response`, so the executors surfaced the status
 *    code and nothing else. The model had no way to correct the call.
 */

import { executeFlagTypesTool, flagTypesTool } from '../tools/flags.js';
import { HuduClient } from '../hudu-client.js';
import { HUDU_FLAG_COLORS } from '../types.js';

const noopClient = {
  createFlagType: async (t: any) => ({ id: 1, ...t }),
  updateFlagType: async (id: number, t: any) => ({ id, ...t }),
} as any;

describe('BUG-12 — flag colours are names, not hex', () => {
  it('advertises the palette in the schema so the model does not guess', () => {
    const color = (flagTypesTool.inputSchema as any).properties.fields.properties.color;
    expect(color.enum).toEqual([...HUDU_FLAG_COLORS]);
    expect(color.description).toMatch(/não hexadecimal|NOME/i);
  });

  it('rejects a hex colour locally and says it belongs to labels', async () => {
    const res = await executeFlagTypesTool(
      { action: 'create', fields: { name: 'x', color: '#654321' } },
      noopClient
    );
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/hexadecimal/i);
    expect(res.error).toContain('Red');
  });

  it('accepts a palette colour', async () => {
    const res = await executeFlagTypesTool(
      { action: 'create', fields: { name: 'x', color: 'Grey' } },
      noopClient
    );
    expect(res.success).toBe(true);
  });

  it('validates the colour on update too', async () => {
    const bad = await executeFlagTypesTool(
      { action: 'update', id: 1, fields: { color: 'Chartreuse' } },
      noopClient
    );
    expect(bad.success).toBe(false);
    expect(bad.error).toContain('Chartreuse');

    const good = await executeFlagTypesTool(
      { action: 'update', id: 1, fields: { color: 'LightBlue' } },
      noopClient
    );
    expect(good.success).toBe(true);
  });
});

describe('BUG-12 — API refusals reach the caller with their reason', () => {
  // Reaches the private static through the class object; the interceptor is
  // wired in the constructor and cannot be called directly.
  const describe_ = (HuduClient as any).describeApiError as (e: any) => string | null;

  it('folds error + details into one line', () => {
    const msg = describe_({
      response: {
        status: 422,
        data: { error: 'Validation failed', details: ['Color must be one of: Red, Blue'] },
      },
    });
    expect(msg).toContain('422');
    expect(msg).toContain('Validation failed');
    expect(msg).toContain('Color must be one of: Red, Blue');
  });

  it('does not quote a Rails HTML page back at the model', () => {
    const msg = describe_({
      response: { status: 404, data: '<!DOCTYPE html><title>404</title>' },
    });
    expect(msg).not.toContain('DOCTYPE');
    expect(msg).toMatch(/método HTTP/);
  });

  it('flags an HTML body on a non-404 as "not JSON" rather than parroting it', () => {
    const msg = describe_({ response: { status: 500, data: '<html>oops</html>' } });
    expect(msg).toContain('500');
    expect(msg).toMatch(/página HTML/);
  });

  it('leaves a network error (no response) to axios', () => {
    expect(describe_({ message: 'timeout of 30000ms exceeded' })).toBeNull();
  });

  it('returns null when the body carries nothing usable', () => {
    expect(describe_({ response: { status: 500, data: {} } })).toBeNull();
  });

  it('handles a plain-text body', () => {
    const msg = describe_({ response: { status: 401, data: 'Bad credentials' } });
    expect(msg).toBe('HTTP 401: Bad credentials');
  });
});
