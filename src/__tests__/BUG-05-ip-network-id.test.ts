/**
 * BUG-05 / REQ-05 — IP address network_id surfacing
 *
 * Tests for formatIpAddressDetail and formatIpAddressList confirming that
 * network_id is surfaced in the output.
 *
 * SPEC-HUDU-FIX-001 Phase 2 (P2-E)
 */

import {
  formatIpAddressList,
  formatIpAddressDetail,
  toPagedResponse,
} from '../../src/formatters/markdown.js';
import type { HuduIpAddress } from '../../src/types.js';

// ---------------------------------------------------------------------------
// formatIpAddressList
// ---------------------------------------------------------------------------
describe('formatIpAddressList — network_id surfacing', () => {
  it('shows network_id in the list row', () => {
    const ips: HuduIpAddress[] = [
      {
        id: 1,
        address: '192.168.1.100',
        fqdn: 'host.local',
        network_id: 42,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatIpAddressList(toPagedResponse(ips));
    expect(result).toContain('42');
    expect(result).toContain('Rede ID');
  });

  it('shows dash when network_id is absent', () => {
    const ips: HuduIpAddress[] = [
      {
        id: 2,
        address: '10.0.0.1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    const result = formatIpAddressList(toPagedResponse(ips));
    // Row should contain '-' for missing network_id
    expect(result).toMatch(/\| - \||\| -$/m);
  });
});

// ---------------------------------------------------------------------------
// formatIpAddressDetail
// ---------------------------------------------------------------------------
describe('formatIpAddressDetail — network_id surfacing', () => {
  it('includes "Rede ID" row with value when network_id is present', () => {
    const ip = {
      id: 10,
      address: '172.16.0.5',
      status: 'assigned',
      network_id: 7,
      company_id: 3,
      asset_id: 99,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatIpAddressDetail(ip);
    expect(result).toContain('| Rede ID |');
    expect(result).toContain('7');
  });

  it('includes "Rede ID" row with dash when network_id is absent', () => {
    const ip = {
      id: 11,
      address: '10.1.1.1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatIpAddressDetail(ip);
    expect(result).toContain('| Rede ID |');
    expect(result).toMatch(/Rede ID.*-/s);
  });

  it('includes address in heading', () => {
    const ip = {
      id: 12,
      address: '192.168.100.1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    const result = formatIpAddressDetail(ip);
    expect(result).toContain('192.168.100.1');
  });
});
