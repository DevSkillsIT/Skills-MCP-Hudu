/**
 * BUG-06 / REQ-06 — Enum resolution helpers
 *
 * Characterisation tests for src/formatters/enums.ts.
 * These tests define the expected behaviour of the enum-resolution helpers
 * and serve as the PRESERVE-phase safety net for subsequent formatter changes.
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-A)
 */

import {
  resolveNetworkType,
  resolveExpirationType,
  resolveListItemLabel,
} from '../../src/formatters/enums.js';

// ---------------------------------------------------------------------------
// resolveNetworkType
// ---------------------------------------------------------------------------
describe('resolveNetworkType', () => {
  it('maps 0 to IPv4', () => {
    expect(resolveNetworkType(0)).toBe('IPv4');
  });

  it('maps 1 to IPv6', () => {
    expect(resolveNetworkType(1)).toBe('IPv6');
  });

  it('maps string-encoded 0 to IPv4', () => {
    expect(resolveNetworkType('0')).toBe('IPv4');
  });

  it('maps string-encoded 1 to IPv6', () => {
    expect(resolveNetworkType('1')).toBe('IPv6');
  });

  it('returns dash for undefined', () => {
    expect(resolveNetworkType(undefined)).toBe('-');
  });

  it('returns dash for null', () => {
    expect(resolveNetworkType(null)).toBe('-');
  });

  it('returns stringified value for out-of-range integer', () => {
    expect(resolveNetworkType(99)).toBe('99');
  });

  it('returns stringified value for negative integer', () => {
    expect(resolveNetworkType(-1)).toBe('-1');
  });

  it('returns original string for non-numeric string', () => {
    expect(resolveNetworkType('IPv4')).toBe('IPv4');
  });

  it('returns original string for unknown string', () => {
    expect(resolveNetworkType('mpls')).toBe('mpls');
  });
});

// ---------------------------------------------------------------------------
// resolveExpirationType
// ---------------------------------------------------------------------------
describe('resolveExpirationType', () => {
  it('capitalises "domain"', () => {
    expect(resolveExpirationType('domain')).toBe('Domain');
  });

  it('capitalises "ssl"', () => {
    expect(resolveExpirationType('ssl')).toBe('Ssl');
  });

  it('capitalises "contract"', () => {
    expect(resolveExpirationType('contract')).toBe('Contract');
  });

  it('preserves already-capitalised value', () => {
    expect(resolveExpirationType('Domain')).toBe('Domain');
  });

  it('returns dash for undefined', () => {
    expect(resolveExpirationType(undefined)).toBe('-');
  });

  it('returns dash for null', () => {
    expect(resolveExpirationType(null)).toBe('-');
  });

  it('returns dash for empty string', () => {
    expect(resolveExpirationType('')).toBe('-');
  });

  it('handles single-character input', () => {
    expect(resolveExpirationType('x')).toBe('X');
  });
});

// ---------------------------------------------------------------------------
// resolveListItemLabel
// ---------------------------------------------------------------------------
describe('resolveListItemLabel', () => {
  it('returns name when both name and id are present', () => {
    expect(resolveListItemLabel('Production', 42)).toBe('Production');
  });

  it('returns trimmed name when name has surrounding whitespace', () => {
    expect(resolveListItemLabel('  Staging  ', 7)).toBe('Staging');
  });

  it('falls back to "ID N" when name is undefined', () => {
    expect(resolveListItemLabel(undefined, 5)).toBe('ID 5');
  });

  it('falls back to "ID N" when name is null', () => {
    expect(resolveListItemLabel(null, 5)).toBe('ID 5');
  });

  it('falls back to "ID N" when name is empty string', () => {
    expect(resolveListItemLabel('', 5)).toBe('ID 5');
  });

  it('returns dash when both name and id are absent', () => {
    expect(resolveListItemLabel(undefined, undefined)).toBe('-');
  });

  it('returns dash when name is null and id is null', () => {
    expect(resolveListItemLabel(null, null)).toBe('-');
  });

  it('uses id 0 as a valid fallback (ID 0)', () => {
    expect(resolveListItemLabel(null, 0)).toBe('ID 0');
  });
});
