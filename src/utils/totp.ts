import { createHmac } from 'crypto';

/**
 * RFC 6238 TOTP, computed locally so the reveal tool can hand out the CURRENT
 * code instead of the seed.
 *
 * Why not return `otp_secret`: the seed is a long-lived second factor. Whoever
 * reads it once can mint codes forever, so it would turn one audited reveal
 * into a permanent capability that never shows up in the audit log again. A
 * code expires in at most one period (30 s by default).
 *
 * Accepts what authenticator apps accept: base32 in any case, with spaces or
 * `=` padding — or a full `otpauth://totp/...` URI, whose `digits`, `period`
 * and `algorithm` are honoured.
 */

export class InvalidOtpSecretError extends Error {
  constructor(reason: string) {
    // The message never quotes the secret: it lands in tool output and logs.
    super(`segredo OTP inválido: ${reason}`);
    this.name = 'InvalidOtpSecretError';
  }
}

export interface TotpResult {
  code: string;
  secondsRemaining: number;
  period: number;
  digits: number;
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ALGORITHMS: Record<string, string> = { SHA1: 'sha1', SHA256: 'sha256', SHA512: 'sha512' };

export function decodeBase32(input: string): Buffer {
  const clean = input.replace(/\s/g, '').replace(/=+$/, '').toUpperCase();
  if (!clean) throw new InvalidOtpSecretError('vazio');

  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new InvalidOtpSecretError('não é base32');
    value = ((value << 5) | idx) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  if (out.length === 0) throw new InvalidOtpSecretError('curto demais');
  return Buffer.from(out);
}

interface TotpParams {
  key: Buffer;
  digits: number;
  period: number;
  algorithm: string;
}

function parseSecret(secret: string): TotpParams {
  const trimmed = (secret ?? '').trim();
  if (!/^otpauth:\/\//i.test(trimmed)) {
    return { key: decodeBase32(trimmed), digits: 6, period: 30, algorithm: 'sha1' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new InvalidOtpSecretError('URI otpauth malformada');
  }
  if (url.host.toLowerCase() !== 'totp') throw new InvalidOtpSecretError('URI otpauth não é TOTP');

  const digits = Number(url.searchParams.get('digits') ?? 6);
  const period = Number(url.searchParams.get('period') ?? 30);
  const algorithm = ALGORITHMS[(url.searchParams.get('algorithm') ?? 'SHA1').toUpperCase()];
  if (!Number.isInteger(digits) || digits < 6 || digits > 10) throw new InvalidOtpSecretError('digits fora de 6-10');
  if (!Number.isInteger(period) || period < 1 || period > 300) throw new InvalidOtpSecretError('period fora de 1-300');
  if (!algorithm) throw new InvalidOtpSecretError('algoritmo não suportado');

  return { key: decodeBase32(url.searchParams.get('secret') ?? ''), digits, period, algorithm };
}

/**
 * Current TOTP code for `secret` at `nowMs`.
 * Throws InvalidOtpSecretError when the secret cannot be used.
 */
export function generateTotp(secret: string, nowMs: number = Date.now()): TotpResult {
  const { key, digits, period, algorithm } = parseSecret(secret);

  const seconds = Math.floor(nowMs / 1000);
  const counter = Math.floor(seconds / period);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac(algorithm, key).update(msg).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) * 2 ** 24) +
    (hmac[offset + 1]! << 16) +
    (hmac[offset + 2]! << 8) +
    hmac[offset + 3]!;

  const code = (binary % 10 ** digits).toString().padStart(digits, '0');
  return { code, secondsRemaining: period - (seconds % period), period, digits };
}
