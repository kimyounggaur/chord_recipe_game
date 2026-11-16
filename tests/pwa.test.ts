import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://chord-kitchen.test';
const SHELL = 'chord-recipe-kitchen-shell-v1.2.0';
const RUNTIME = 'chord-recipe-kitchen-assets-v1.2.0';

type RequestLike = { url: string; method: string; mode: string };
type CacheKey = string | { url: string };

function workerFixture() {
  const handlers = new Map<string, (event: any) => void>();
  const buckets = new Map<string, MockCache>();
  const fetched: string[] = [];
  const deleted: string[] = [];
  let offline = false;
  let skipped = 0;
  let claimed = 0;
  const documents = new Map<string, string>([
    ['/', '<!doctype html><html>Kitchen</html>'],
    ['/index.html', '<!doctype html><script type="module" src="/assets/app-a1.js"></script><link rel="stylesheet" href="/assets/app-b2.css"><script src="https://elsewhere.test/tracker.js"></script>'],
    ['/manifest.webmanifest', '{"name":"코드 레시피 키친"}'],
    ['/icon.svg', '<svg/>'],
    ['/assets/app-a1.js', 'import {music} from "./music-c3.js"; const later=()=>import("./lessons-d4.js");'],
    ['/assets/music-c3.js', 'export const music=[4,3];'],
    ['/assets/lessons-d4.js', 'import "./music-c3.js"; export const count=24;'],
    ['/assets/app-b2.css', 'body{color:#3e281c}'],
    ['/assets/kitchen.png', 'PNG image fixture'],
  ]);
  const key = (input: CacheKey) => new URL(typeof input === 'string' ? input : input.url, ORIGIN).href;
  async function fetchMock(input: CacheKey): Promise<Response> {
    const url = new URL(key(input));
    fetched.push(url.pathname);
    if (offline) throw new TypeError('Network offline');
    const body = documents.get(url.pathname);
    const response = new Response(body ?? 'missing', { status: body === undefined ? 404 : 200 });
    Object.defineProperty(response, 'type', { value: 'basic' });
    return response;
  }
  class MockCache {
    responses = new Map<string, Response>();
    async add(input: CacheKey) {
      const response = await fetchMock(input);
      if (!response.ok) throw new Error('Cache.add failed');
      await this.put(input, response);
    }
    async addAll(inputs: CacheKey[]) { for (const input of inputs) await this.add(input); }
    async match(input: CacheKey) { return this.responses.get(key(input))?.clone(); }
    async put(input: CacheKey, response: Response) { this.responses.set(key(input), response.clone()); }
    async keys() { return [...this.responses.keys()].map(url => ({ url })); }
    async delete(input: CacheKey) { return this.responses.delete(key(input)); }
  }
  const cachesMock = {
    async open(name: string) {
      if (!buckets.has(name)) buckets.set(name, new MockCache());
      return buckets.get(name)!;
    },
    async keys() { return [...buckets.keys()]; },
    async delete(name: string) { deleted.push(name); return buckets.delete(name); },
    async match(input: CacheKey) {
      for (const bucket of buckets.values()) {
        const result = await bucket.match(input);
        if (result) return result;
      }
      return undefined;
    },
  };
  const selfMock = {
    location: { origin: ORIGIN },
    addEventListener(type: string, handler: (event: any) => void) { handlers.set(type, handler); },
    skipWaiting() { skipped++; return Promise.resolve(); },
    clients: { claim() { claimed++; return Promise.resolve(); } },
  };
  vm.runInNewContext(source, { self: selfMock, caches: cachesMock, fetch: fetchMock, URL, Response, Promise, Set }, { filename: 'sw.js' });
  return {
    buckets, fetched, deleted, caches: cachesMock,
    get skipped() { return skipped; }, get claimed() { return claimed; },
    setOffline(value: boolean) { offline = value; },
    async lifecycle(type: 'install' | 'activate') {
      const waits: Promise<unknown>[] = [];
      handlers.get(type)!({ waitUntil(promise: Promise<unknown>) { waits.push(promise); } });
      await Promise.all(waits);
    },
    message(data: unknown) { handlers.get('message')!({ data }); },
    async request(path: string, overrides: Partial<RequestLike> = {}) {
      const request = { url: new URL(path, ORIGIN).href, method: 'GET', mode: 'cors', ...overrides };
      let response: Promise<Response> | undefined;
      handlers.get('fetch')!({ request, respondWith(value: Promise<Response>) { response = value; } });
      return response ? await response : undefined;
    },
  };
}

test('PWA install caches app shell, Vite entry/style and recursive local chunks', async () => {
  const worker = workerFixture();
  await worker.lifecycle('install');
  const shell = worker.buckets.get(SHELL)!;
  for (const path of ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/assets/app-a1.js', '/assets/app-b2.css', '/assets/music-c3.js', '/assets/lessons-d4.js']) {
    assert.ok(await shell.match(path), `${path} must be usable offline after installation`);
  }
  assert.equal(worker.fetched.filter(path => path === '/assets/music-c3.js').length, 1, 'shared dependency is fetched once');
  assert.equal(worker.fetched.includes('/tracker.js'), false, 'cross-origin imports are not precached');
  assert.equal(worker.skipped, 0, 'install must not skip waiting');
});

test('PWA serves cached navigation and bundled code when offline; missing images fail without losing shell', async () => {
  const worker = workerFixture();
  await worker.lifecycle('install');
  worker.setOffline(true);
  const document = await worker.request('/lesson/L01', { mode: 'navigate' });
  assert.equal(document?.status, 200);
  assert.match(await document!.text(), /app-a1\.js/);
  const module = await worker.request('/assets/music-c3.js');
  assert.equal(module?.status, 200);
  assert.match(await module!.text(), /music=\[4,3\]/);
  const missingImage = await worker.request('/assets/not-downloaded.png');
  assert.equal(missingImage?.status, 503);
  assert.ok(await worker.caches.match('/index.html'));
});

test('PWA runtime caches viewed artwork and reuses it offline', async () => {
  const worker = workerFixture();
  await worker.lifecycle('install');
  const online = await worker.request('/assets/kitchen.png');
  assert.equal(await online!.text(), 'PNG image fixture');
  assert.ok(await worker.buckets.get(RUNTIME)!.match('/assets/kitchen.png'));
  worker.setOffline(true);
  const offline = await worker.request('/assets/kitchen.png');
  assert.equal(await offline!.text(), 'PNG image fixture');
});

test('offline lookup uses only the current worker caches when old or unrelated caches contain the same URL', async () => {
  const worker = workerFixture();
  const other = await worker.caches.open('another-music-app-v1');
  await other.put('/index.html', new Response('unrelated app'));
  await other.put('/assets/kitchen.png', new Response('unrelated artwork'));
  const old = await worker.caches.open('chord-recipe-kitchen-shell-v1.0.0');
  await old.put('/index.html', new Response('previous app shell'));
  await old.put('/assets/kitchen.png', new Response('previous artwork'));
  await worker.lifecycle('install');
  assert.equal(await (await worker.request('/assets/kitchen.png'))!.text(), 'PNG image fixture');
  worker.setOffline(true);
  const document = await worker.request('/lesson/L01', { mode: 'navigate' });
  assert.match(await document!.text(), /app-a1\.js/);
  const image = await worker.request('/assets/kitchen.png');
  assert.equal(await image!.text(), 'PNG image fixture');
});

test('PWA waits for explicit update action and removes only this app older caches', async () => {
  const worker = workerFixture();
  await worker.lifecycle('install');
  await worker.caches.open('chord-recipe-kitchen-shell-v0.9.0');
  await worker.caches.open('another-music-app-v1');
  await worker.caches.open(RUNTIME);
  await worker.lifecycle('activate');
  assert.equal(worker.skipped, 0, 'activation does not force a newly waiting worker');
  assert.equal(worker.claimed, 1);
  assert.deepEqual(worker.deleted, ['chord-recipe-kitchen-shell-v0.9.0']);
  assert.ok(worker.buckets.has(SHELL));
  assert.ok(worker.buckets.has(RUNTIME));
  assert.ok(worker.buckets.has('another-music-app-v1'));
  worker.message({ type: 'CHECK_STATUS' });
  assert.equal(worker.skipped, 0);
  worker.message({ type: 'SKIP_WAITING' });
  assert.equal(worker.skipped, 1);
  worker.message('SKIP_WAITING');
  assert.equal(worker.skipped, 2);
});

test('PWA ignores non-GET and cross-origin requests and explains a cold offline navigation', async () => {
  const worker = workerFixture();
  assert.equal(await worker.request('/assets/kitchen.png', { method: 'POST' }), undefined);
  assert.equal(await worker.request('https://elsewhere.test/file.js'), undefined);
  worker.setOffline(true);
  const response = await worker.request('/lesson/L01', { mode: 'navigate' });
  assert.equal(response?.status, 503);
  assert.match(await response!.text(), /온라인 연결/);
});
