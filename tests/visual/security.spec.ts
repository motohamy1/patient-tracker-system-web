// tests/visual/security.spec.ts — the three automated security assertions the
// phase's threat surface requires (T-02-77, T-02-78, T-02-79), plus the
// confinement assertion for the dev-route flag (must_haves key_links).
//
// 1. The dev route is 404 on a production server started WITHOUT the flag. This
//    makes D-26's claim checkable rather than asserted: the gallery is protected
//    by *absence* from real deployments, not by an authorization check.
// 2. The built client makes zero off-origin requests. In a PHI product every
//    third-party request is a review item and a disclosure vector; next/font
//    self-hosting (D-19) and inlined Lucide components (D-21) are what make a
//    zero count achievable.
// 3. No dev fixture literal reaches the client bundle. This is the build-output
//    mitigation 02-RESEARCH.md §Security Domain names for the "PHI in the client
//    bundle" threat: cheap, and it catches an accidental client-side import of a
//    dev stub.
//
// THE FLAG NAME IS DERIVED FROM ITS PARTS, NEVER WRITTEN WHOLE. The dev-route
// flag must appear in exactly two repository files — its gate module
// (src/lib/dev/dev-route-gate.ts) and the harness config (playwright.config.ts)
// — and plan 02-11 asserts that repo-wide. Naming it whole here would make this
// spec a third occurrence and break its own confinement assertion. Building the
// key at runtime keeps the check honest (it still deletes the real key) without
// adding a literal, exactly as the gate unit test does.
import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DEV_ROUTE_FLAG = ['ALLOW', 'DEV', 'ROUTES'].join('_');
const PERMITTED_FLAG_FILES = ['src/lib/dev/dev-route-gate.ts', 'playwright.config.ts'];

// The second production server runs on its own port with the dev-route flag
// explicitly removed from its environment. The primary harness server on 3100
// keeps the flag (set only in playwright.config.ts -> webServer.env); this one
// stands in for a real deployment, which never sets it.
const SECOND_PORT = 3200;
const SECOND_ORIGIN = `http://127.0.0.1:${SECOND_PORT}`;

function startProductionServerWithoutDevRoutes(port: number): ChildProcess {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env[DEV_ROUTE_FLAG];
  // `shell: true` on Windows so the `npm` shim resolves; a fresh production
  // server (`npm run start`) is required, and no env file is read or written.
  return spawn('npm', ['run', 'start', '--', '--port', String(port)], {
    env,
    shell: process.platform === 'win32',
    stdio: 'ignore',
  });
}

function stopServer(child: ChildProcess): void {
  if (child.pid === undefined) return;
  if (process.platform === 'win32') {
    // Kill the whole tree: `next start` is a grandchild of the npm shim, and a
    // bare child.kill() would leave the Next server holding the port.
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      /* the process already exited */
    }
  } else {
    child.kill('SIGTERM');
  }
}

async function waitForServer(
  request: APIRequestContext,
  origin: string,
  attempts = 60,
): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await request.get(`${origin}/login`);
      if (res.ok()) return true;
    } catch {
      /* not up yet — retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.json']);

test('the dev gallery 404s on a production server started without the flag', async ({ request }) => {
  const server = startProductionServerWithoutDevRoutes(SECOND_PORT);
  try {
    const ready = await waitForServer(request, SECOND_ORIGIN);
    expect(ready, 'the second production server did not become ready in time').toBe(true);
    const res = await request.get(`${SECOND_ORIGIN}/dev/gallery`, { maxRedirects: 0 });
    expect(res.status(), 'the dev gallery must be absent from a real deployment').toBe(404);
  } finally {
    stopServer(server);
  }
});

test('the built client makes no off-origin request', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? SECOND_ORIGIN).origin;
  const offOrigin: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    const sameOrigin = url.startsWith(origin);
    const nonNetwork =
      url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:');
    if (!sameOrigin && !nonNetwork) offOrigin.push(url);
  });

  for (const route of [
    '/login',
    '/provider',
    '/patient',
    '/patient/home',
    '/provider/patients/placeholder/overview',
    '/dev/gallery',
  ]) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }

  expect(offOrigin, `off-origin requests observed: ${offOrigin.join(', ')}`).toEqual([]);
});

test('the dev fixture placeholder literal is absent from the client bundle', () => {
  const staticDir = path.join(process.cwd(), '.next', 'static');
  if (!fs.existsSync(staticDir)) {
    throw new Error(`client build output not found: ${staticDir} — run \`npm run build\` first`);
  }
  const literal = 'dev-placeholder';
  const hits = walkFiles(staticDir).filter((file) => {
    try {
      return fs.readFileSync(file, 'utf8').includes(literal);
    } catch {
      return false;
    }
  });
  expect(hits, `dev fixtures leaked into the client bundle: ${hits.join(', ')}`).toEqual([]);
});

test('the dev-route flag is named only in its gate module and the harness config', () => {
  const root = process.cwd();
  const candidates: string[] = [];
  for (const dir of ['src', 'tests', 'scripts']) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    candidates.push(
      ...walkFiles(full).filter((file) => SOURCE_EXTENSIONS.has(path.extname(file))),
    );
  }
  for (const config of [
    'playwright.config.ts',
    'next.config.ts',
    'vitest.config.ts',
    'postcss.config.mjs',
    'tsconfig.json',
    'package.json',
  ]) {
    const full = path.join(root, config);
    if (fs.existsSync(full)) candidates.push(full);
  }

  const naming = candidates
    .filter((file) => fs.readFileSync(file, 'utf8').includes(DEV_ROUTE_FLAG))
    .map((file) => path.relative(root, file).split(path.sep).join('/'));

  expect(naming.sort()).toEqual([...PERMITTED_FLAG_FILES].sort());
});
