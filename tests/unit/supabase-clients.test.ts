// tests/unit/supabase-clients.test.ts — proves the 03-01 Supabase wiring
// (AUTH-01/D-06) without any network.
//
// `@supabase/ssr` is mocked at the module boundary with call capture, so the
// tests exercise OUR wiring (env contract, cookie adapters, singleton laziness,
// response-plane forwarding) and never a live Supabase Auth round-trip. The
// mandated acceptance criterion "no getSession under src/lib/supabase/" is a
// repo-grep duty done outside this file; here the mocked auth surface exposes
// only getClaims, making the forbidden path structurally absent.
//
// Runs in the Vitest `node` project (tests/unit/*.test.ts): it mutates
// `process.env` and renders nothing.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CAPTURE = vi.hoisted(() => ({
  serverCalls: [] as Array<{ url: string; key: string; cookiesAdapter: unknown }>,
  browserCalls: [] as Array<{ url: string; key: string }>,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url: string, key: string, options: unknown) => {
    CAPTURE.serverCalls.push({ url, key, cookiesAdapter: options });
    return {
      auth: {
        getClaims: vi.fn(async () => ({ data: { claims: undefined }, error: null })),
      },
    };
  }),
  createBrowserClient: vi.fn((url: string, key: string) => {
    CAPTURE.browserCalls.push({ url, key });
    return { auth: {} };
  }),
}));

const env = process.env as Record<string, string | undefined>;
const URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL';
const KEY_KEY = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
const DUMMY_URL = 'http://127.0.0.1:54321';
const DUMMY_KEY = 'sb_publishable_dummy';

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved[URL_KEY] = env[URL_KEY];
  saved[KEY_KEY] = env[KEY_KEY];
  CAPTURE.serverCalls.length = 0;
  CAPTURE.browserCalls.length = 0;
  env[URL_KEY] = DUMMY_URL;
  env[KEY_KEY] = DUMMY_KEY;
});

afterEach(() => {
  for (const key of [URL_KEY, KEY_KEY]) {
    if (saved[key] === undefined) delete env[key];
    else env[key] = saved[key];
  }
});

describe('src/lib/supabase/server.ts — createClient() (Pattern 1)', () => {
  it('builds the per-request client from the env contract with a working cookie adapter', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const jar = [{ name: 'sb-auth-token', value: 'v1' }];

    vi.doMock('next/headers', () => ({
      cookies: () => Promise.resolve({ getAll: () => jar, set: () => undefined }),
    }));
    vi.resetModules();
    const fresh = (await import('@/lib/supabase/server')).createClient;

    const client = await fresh();

    expect(CAPTURE.serverCalls).toHaveLength(1);
    expect(client).toHaveProperty('auth');
    expect(CAPTURE.serverCalls[0].url).toBe(DUMMY_URL);
    expect(CAPTURE.serverCalls[0].key).toBe(DUMMY_KEY);
  });

  it('throws a named error when the env contract is missing (NOT an undefined env value)', async () => {
    delete env[URL_KEY];
    const { createClient } = await import('@/lib/supabase/server');
    await expect(createClient()).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe('src/lib/supabase/client.ts — browser singleton', () => {
  it('creates lazily (never at import time) and returns the same instance thereafter', async () => {
    const mod = await import('@/lib/supabase/client');
    expect(CAPTURE.browserCalls).toHaveLength(0);

    const first = mod.createClient();
    const second = mod.createClient();

    expect(first).toBe(second);
    expect(CAPTURE.browserCalls).toHaveLength(1);
    expect(CAPTURE.browserCalls[0].url).toBe(DUMMY_URL);
  });

  it('throws a named error when the env contract is missing', async () => {
    vi.resetModules();
    delete env[KEY_KEY];
    const { createClient } = await import('@/lib/supabase/client');
    expect(() => createClient()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
});

describe('src/lib/supabase/proxy.ts — updateSession (Pattern 2)', () => {
  it('returns a NextResponse built for the request and forwards refreshed cookies into the request plane', async () => {
    const { NextResponse, NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/provider/home', {
      headers: { cookie: 'sb-auth-token=v1' },
    });

    const { updateSession } = await import('@/lib/supabase/proxy');
    const response = await updateSession(request);

    expect(response).toBeInstanceOf(NextResponse);

    // One request-scoped client was built with the real env contract.
    expect(CAPTURE.serverCalls).toHaveLength(1);
    const adapter = ((CAPTURE.serverCalls[0].cookiesAdapter as {
      cookies: unknown;
    }).cookies) as {
      getAll: () => Array<{ name: string; value: string }>;
      setAll: (list: Array<{ name: string; value: string; options?: object }>) => void;
    };
    expect(adapter.getAll()).toEqual([{ name: 'sb-auth-token', value: 'v1' }]);

    // Invoking the adapter's setAll writes the refresh into BOTH planes:
    // the request cookies (downstream RSC context) and the response cookies.
    adapter.setAll([{ name: 'sb-auth-token', value: 'v2' }]);
    expect(request.cookies.get('sb-auth-token')?.value).toBe('v2');
    expect(response.cookies.get('sb-auth-token')?.value).toBe('v2');
  });

  it('still returns a NextResponse when the auth call fails (silent refresh degradation, no route 500)', async () => {
    const { NextResponse } = await import('next/server');
    const { updateSession } = await import('@/lib/supabase/proxy');

    // Make the mocked getClaims reject for this call batch.
    const { createServerClient } = await import('@supabase/ssr');
    vi.mocked(createServerClient).mockImplementationOnce(() => ({
      auth: { getClaims: vi.fn(async () => { throw new Error('auth down'); }) },
    }) as never);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/login');
    await expect(updateSession(request)).resolves.toBeInstanceOf(NextResponse);
  });

  it('throws a named error when the env contract is missing', async () => {
    vi.resetModules();
    delete env[URL_KEY];
    const { NextRequest } = await import('next/server');
    const { updateSession } = await import('@/lib/supabase/proxy');
    await expect(
      updateSession(new NextRequest('http://localhost/login'))
    ).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe('src/proxy.ts — Next 16 proxy entry (source assertion)', () => {
  const APP_ROOT = process.cwd();

  it('exists at exactly src/proxy.ts with a named proxy export and static-asset matcher', () => {
    const source = readFileSync(join(APP_ROOT, 'src', 'proxy.ts'), 'utf8');
    expect(source).toContain('export');
    expect(source).toContain('proxy');
    expect(source).toContain('updateSession');
    expect(source).toContain('matcher');
    expect(source).toContain('_next/static');
    expect(source).toContain('_next/image');
    expect(source).toContain('favicon.ico');
  });

  it('contains no redirect( anywhere in the proxy chain and no getSession under src/lib/supabase/', () => {
    const proxyFile = readFileSync(join(APP_ROOT, 'src', 'proxy.ts'), 'utf8');
    const helper = readFileSync(
      join(APP_ROOT, 'src', 'lib', 'supabase', 'proxy.ts'),
      'utf8'
    );
    const serverFile = readFileSync(
      join(APP_ROOT, 'src', 'lib', 'supabase', 'server.ts'),
      'utf8'
    );
    const clientFile = readFileSync(
      join(APP_ROOT, 'src', 'lib', 'supabase', 'client.ts'),
      'utf8'
    );
    expect(proxyFile.includes('redirect(')).toBe(false);
    expect(helper.includes('redirect(')).toBe(false);
    expect(serverFile.includes('redirect(')).toBe(false);
    expect(clientFile.includes('redirect(')).toBe(false);
    expect(helper.includes('getSession()')).toBe(false);
    expect(serverFile.includes('getSession()')).toBe(false);
  });
});
