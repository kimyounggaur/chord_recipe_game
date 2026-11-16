/* App-owned caches only. New workers wait for an explicit update action. */
const PREFIX = 'chord-recipe-kitchen-';
const VERSION = 'v1.1.0';
const SHELL = `${PREFIX}shell-${VERSION}`;
const RUNTIME = `${PREFIX}assets-${VERSION}`;
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

// Cache Storage is shared by the whole origin, including older waiting workers
// and unrelated applications. Only serve files owned by this worker's version.
async function matchAppCache(request) {
  return (await (await caches.open(SHELL)).match(request)) ||
    (await (await caches.open(RUNTIME)).match(request));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(CORE);
    const response = await cache.match('/index.html');
    const html = response ? await response.text() : '';
    // Vite's production entry scripts/styles contain the complete lesson and music data.
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)]
      .map(match => new URL(match[1], self.location.origin))
      .filter(url => url.origin === self.location.origin)
      .map(url => url.pathname);
    const queued = [...new Set(assets)];
    const seen = new Set();
    while (queued.length && seen.size < 80) {
      const pathname = queued.shift();
      if (seen.has(pathname)) continue;
      seen.add(pathname);
      await cache.add(pathname);
      if (!pathname.endsWith('.js')) continue;
      const source = await (await cache.match(pathname)).text();
      // Cache static/dynamic production chunks referenced by entry modules as well.
      for (const match of source.matchAll(/(?:from\s*|import\s*\(|import\s*)["']([^"']+\.js)["']/g)) {
        const dependency = new URL(match[1], new URL(pathname, self.location.origin));
        if (dependency.origin === self.location.origin && !seen.has(dependency.pathname)) queued.push(dependency.pathname);
      }
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== SHELL && name !== RUNTIME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        // Do not replace this worker's matching app shell with a later build's HTML.
        if (response.ok) return response;
        return (await (await caches.open(SHELL)).match('/index.html')) || response;
      } catch { return (await (await caches.open(SHELL)).match('/index.html')) || new Response('처음 온라인 연결 후 오프라인 학습을 사용할 수 있어요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  if (!/\.(?:js|css|png|webp|jpg|jpeg|svg|woff2?|webmanifest)$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cached = await matchAppCache(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(RUNTIME);
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        if (keys.length > 80) await cache.delete(keys[0]);
      }
      return response;
    } catch { return new Response('', { status: 503 }); }
  })());
});
