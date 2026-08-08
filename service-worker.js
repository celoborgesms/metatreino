const APP_VERSION = 'v12.55';
const CACHE = 'metatreino-' + APP_VERSION;
// manifest.json entra aqui de propósito: é o arquivo que o Chrome consulta pra
// detectar mudança de ícone/nome e reemitir o app instalado. Em cache-first ele
// recebia a versão antiga e o ícone nunca atualizava sozinho.
const CRITICAL = ['./index.html', './app.js', './manifest.json']; // network-first
const STATIC = ['./icon.svg', './icon-512.png']; // cache-first

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([...CRITICAL, ...STATIC, './'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const path = url.pathname.replace(/^.*\//, './');
  const isCritical = CRITICAL.includes(path) || url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('/manifest.json');

  if (isCritical) {
    // Network-first com revalidação forçada (GitHub Pages usa cache HTTP de 10min)
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for static assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      }))
    );
  }
});
