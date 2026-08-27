/**
 * BUG-05 / REQ-05 — IP address context surfacing
 *
 * Live-API finding (2026-05-21): Hudu API 2.41.2 does NOT return network_id on
 * the IP address record payload (the OpenAPI schema declares it, but the live
 * endpoint omits it). It DOES return asset_id + asset_name (+ asset_url) and
 * company_id. The fix surfaces the asset as the primary context and hydrates
 * the company; network_id is only rendered when actually present.
 *
 * These tests validate against the REAL API shape (asset_name present,
 * network_id absent), not the earlier assumption.
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-E), revised after live validation.
 */

import {
  formatIpAddressList,
  formatIpAddressDetail,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduIpAddress } from '../../src/types.js';

// Mirrors the real Hudu API payload for GET /ip_addresses/{id}.
const realShapeIp: HuduIpAddress = {
  id: 2,
  address: '198.51.100.1',
  status: 'Assigned',
  fqdn: 'fw-example.corp.local',
  description: 'IP LAN Rede Corp',
  asset_id: 976,
  asset_name: 'Example Firewall',
  asset_url: '/a/7f23df6da7c7',
  company_id: 74,
  // note: no network_id — the live API does not return it
  created_at: '2025-08-05T11:43:37.813Z',
  updated_at: '2025-08-05T11:46:55.828Z',
};

describe('formatIpAddressList — asset context', () => {
  it('shows the asset name and ID in the row when present', () => {
    const result = formatIpAddressList(toPagedResponse([realShapeIp]));
    expect(result).toContain('Example Firewall');
    expect(result).toContain('(ID: 976)');
    expect(result).toContain('Ativo'); // column header
  });

  it('falls back to "ID: N" when only asset_id is present', () => {
    const ip: HuduIpAddress = {
      id: 3,
      address: '10.0.0.1',
      asset_id: 50,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatIpAddressList(toPagedResponse([ip]));
    expect(result).toContain('ID: 50');
  });

  it('shows "-" for the asset column when neither name nor id present', () => {
    const ip: HuduIpAddress = {
      id: 4,
      address: '10.0.0.2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatIpAddressList(toPagedResponse([ip]));
    expect(result).toMatch(/\| - \|/);
  });
});

describe('formatIpAddressDetail — asset + company context', () => {
  it('renders the asset as "Name (ID: N)" — the real API context', () => {
    const result = formatIpAddressDetail(realShapeIp);
    expect(result).toContain('| Ativo |');
    expect(result).toContain('Example Firewall (ID: 976)');
  });

  it('shows company id when name is not hydrated', () => {
    const result = formatIpAddressDetail(realShapeIp);
    expect(result).toContain('| Empresa |');
    expect(result).toContain('ID: 74');
  });

  it('hydrates company name when present', () => {
    const result = formatIpAddressDetail({ ...realShapeIp, company_name: 'Example Co' });
    expect(result).toContain('Example Co (ID: 74)');
  });

  it('OMITS the Rede ID row when the API does not return network_id', () => {
    const result = formatIpAddressDetail(realShapeIp);
    expect(result).not.toContain('| Rede ID |');
  });

  it('shows the Rede ID row only when network_id is actually present', () => {
    const result = formatIpAddressDetail({ ...realShapeIp, network_id: 7 });
    expect(result).toContain('| Rede ID | 7 |');
  });

  it('includes the address in the heading', () => {
    const result = formatIpAddressDetail(realShapeIp);
    expect(result).toContain('198.51.100.1');
  });
});
