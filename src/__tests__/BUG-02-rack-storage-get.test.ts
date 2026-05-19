/**
 * BUG-02: Rack detail retrieval — getRackStorage "not found" for valid IDs
 *
 * Bug: getRackStorage(id) in hudu-client.ts calls GET /rack_storages/{id} and
 * attempts to return response.data.rack_storage directly. When the Hudu API
 * returns HTTP 200 with { rack_storage: null } (a valid-but-not-found scenario),
 * or when the response wrapper is absent, the method returns undefined/null
 * silently instead of throwing a descriptive error.
 *
 * Root cause: Missing null guard after destructuring { rack_storage } from the
 * API response. The search tool returns IDs correctly via GET /rack_storages
 * (list), but the single-item endpoint GET /rack_storages/{id} may respond with
 * { rack_storage: null } on some Hudu versions.
 *
 * Fix: Add guard `if (!response.data?.rack_storage) throw new Error(...)` matching
 * the WIP pattern (wip/hudu-pre-spec-2026-05-19 src/hudu-client.ts). The guard
 * is the correct fix — NOT the WIP "not found" message which could mask the real
 * 404 from the HTTP client.
 *
 * Files: src/hudu-client.ts (getRackStorage method, line ~856)
 *
 * FAILURE EVIDENCE (pre-fix run):
 *   Expected: rejects with "Rack storage with ID 99 not found"
 *   Received: resolves with undefined (no error thrown)
 *
 * REQ: REQ-02 / SPEC-HUDU-FIX-001
 */

import { jest, describe, test, expect } from '@jest/globals';
import { HuduClient } from '../hudu-client.js';
// Note: mockResolvedValue generic must be typed as any to avoid TS strict inference on jest.fn()

// Minimal config for HuduClient construction — no real HTTP calls are made
const TEST_CONFIG = {
  baseUrl: 'https://hudu.example.com',
  apiKey: 'test-key',
  timeout: 5000,
};

describe('BUG-02: getRackStorage — null wrapper returns descriptive error', () => {
  test('getRackStorage returns null when API returns { rack_storage: null }', async () => {
    const client = new HuduClient(TEST_CONFIG);

    // Simulate API returning HTTP 200 with rack_storage: null
    // This happens when Hudu returns a wrapper but the item is missing
    const mockGet = jest.fn<() => Promise<any>>().mockResolvedValue({
      data: { rack_storage: null }
    });
    (client as any).client = { get: mockGet };

    await expect(client.getRackStorage(99)).rejects.toThrow(
      /Rack storage with ID 99 not found/i
    );
    expect((mockGet as any).mock.calls[0][0]).toBe('/rack_storages/99');
  });

  test('getRackStorage returns null when API returns { rack_storage: undefined }', async () => {
    const client = new HuduClient(TEST_CONFIG);

    const mockGet = jest.fn<() => Promise<any>>().mockResolvedValue({
      data: {}
    });
    (client as any).client = { get: mockGet };

    await expect(client.getRackStorage(42)).rejects.toThrow(
      /Rack storage with ID 42 not found/i
    );
  });

  test('getRackStorage resolves correctly when API returns valid rack_storage', async () => {
    const client = new HuduClient(TEST_CONFIG);

    const mockRack = {
      id: 7,
      name: 'Rack-A1',
      company_id: 1,
      height: 42,
      width: 19,
      starting_unit: 1,
    };

    const mockGet = jest.fn<() => Promise<any>>().mockResolvedValue({
      data: { rack_storage: mockRack }
    });
    (client as any).client = { get: mockGet };

    const result = await client.getRackStorage(7);
    expect(result).toEqual(mockRack);
    expect((mockGet as any).mock.calls[0][0]).toBe('/rack_storages/7');
  });

  test('getRackStorage uses correct API path /rack_storages/{id}', async () => {
    const client = new HuduClient(TEST_CONFIG);

    const mockGet = jest.fn<() => Promise<any>>().mockResolvedValue({
      data: { rack_storage: { id: 15, name: 'DC-Rack-01', company_id: 1, height: 42, width: 19, starting_unit: 1 } }
    });
    (client as any).client = { get: mockGet };

    await client.getRackStorage(15);
    // Confirm the correct singular endpoint path (not /rack_storage/{id})
    expect((mockGet as any).mock.calls[0][0]).toBe('/rack_storages/15');
  });
});
