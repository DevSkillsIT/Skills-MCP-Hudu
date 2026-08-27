/**
 * BUG-11 — kickoff / duplicate / create_from_template were dead
 *
 * The three member actions on /procedures are POST routes:
 *
 *   resources :procedures do
 *     member do
 *       post :kickoff
 *       post :create_from_template
 *       post :duplicate
 *     end
 *   end
 *
 * The client issued PUT. Live check against Hudu 2.44.3 on 2026-08-27:
 * all three answered `404` with a Rails HTML error page, so the failure
 * surfaced to the user as a parse error rather than "not found".
 *
 * They also sent no body at all, which made them useless even once routed:
 * `kickoff` could not name the run or attach an asset, and `duplicate` /
 * `create_from_template` could not name the copy.
 */

import { HuduClient } from '../hudu-client.js';

type Recorded = { method: string; url: string; body?: any };

function clientWithSpy(): { client: HuduClient; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const client = new HuduClient({
    baseUrl: 'https://hudu.example.com',
    apiKey: 'k',
    timeout: 30000,
  });

  const fake = {
    get: async (url: string) => {
      calls.push({ method: 'GET', url });
      return { data: {} };
    },
    post: async (url: string, body?: any) => {
      calls.push({ method: 'POST', url, body });
      return { data: { procedure: { id: 99, name: body?.name ?? 'copy' } } };
    },
    put: async (url: string, body?: any) => {
      calls.push({ method: 'PUT', url, body });
      return { data: { procedure: { id: 99 } } };
    },
    delete: async (url: string) => {
      calls.push({ method: 'DELETE', url });
      return { data: {} };
    },
  };
  // The client keeps its axios instance private; swap it for the recorder.
  (client as unknown as { client: typeof fake }).client = fake;

  return { client, calls };
}

describe('BUG-11 — procedure member actions use POST', () => {
  it('kickoff posts, and carries the run name and asset', async () => {
    const { client, calls } = clientWithSpy();
    await client.kickoffProcedure(9, { name: 'Onboarding Fulano', asset_id: 42 });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.url).toBe('/procedures/9/kickoff');
    expect(calls[0]!.body).toEqual({ name: 'Onboarding Fulano', asset_id: 42 });
  });

  it('duplicate posts, and carries the new name', async () => {
    const { client, calls } = clientWithSpy();
    await client.duplicateProcedure(9, { name: 'Cópia', company_id: 3 });

    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.url).toBe('/procedures/9/duplicate');
    expect(calls[0]!.body).toEqual({ name: 'Cópia', description: undefined, company_id: 3 });
  });

  it('create_from_template posts, and carries the new name', async () => {
    const { client, calls } = clientWithSpy();
    await client.createFromTemplate(1, { name: 'A partir do template' });

    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.url).toBe('/procedures/1/create_from_template');
    expect(calls[0]!.body).toMatchObject({ name: 'A partir do template' });
  });

  it('never falls back to PUT for these three', async () => {
    const { client, calls } = clientWithSpy();
    await client.kickoffProcedure(1);
    await client.duplicateProcedure(1);
    await client.createFromTemplate(1);

    expect(calls.every((c) => c.method === 'POST')).toBe(true);
  });

  it('unwraps a bare procedure body as well as a {procedure:...} envelope', async () => {
    const { client } = clientWithSpy();
    const withEnvelope = await client.kickoffProcedure(9, { name: 'x' });
    expect(withEnvelope.id).toBe(99);

    // The kickoff route renders `render(json: run, adapter: :json)`, which has
    // produced both shapes across Hudu versions. Neither may throw.
    (client as unknown as { client: { post: unknown } }).client.post = async () => ({
      data: { id: 123, name: 'bare' },
    });
    const bare = await client.kickoffProcedure(9, { name: 'x' });
    expect(bare.id).toBe(123);
  });
});

describe('BUG-11 — archive still uses PUT', () => {
  it('leaves the routes that really are PUT alone', async () => {
    const { client, calls } = clientWithSpy();
    await client.archiveArticle(5);
    expect(calls[0]!.method).toBe('PUT');
    expect(calls[0]!.url).toBe('/articles/5/archive');
  });
});
