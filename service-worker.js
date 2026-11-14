const APP_VERSION = '2027.1-beta.36';
const CACHE = 'metatreino-' + APP_VERSION;
// manifest.json entra aqui de propósito: é o arquivo que o Chrome consulta pra
// detectar mudança de ícone/nome e reemitir o app instalado. Em cache-first ele
// recebia a versão antiga e o ícone nunca atualizava sozinho.
const CRITICAL = ['./index.html', './app.js', './app-plus.js', './manifest.json']; // network-first
const STATIC = ['./icon.svg', './icon-512.png']; // cache-first

// Beta 33: a instalação baixa direto do servidor (cache:'reload'). Antes podia guardar o app.js
// antigo que ainda estava no cache HTTP do navegador (o GitHub Pages guarda por 10 min) e,
// sem internet, o app abria com arquivos de versões diferentes.
// Firebase (mesma versão do index.html): guardado já na instalação para o app abrir sem internet
// mesmo que a primeira visita tenha sido a única com conexão. Se falhar, não impede a instalação.
const FIREBASE = ['app', 'auth', 'firestore'].map(m => `https://www.gstatic.com/firebasejs/10.12.0/firebase-${m}-compat.js`);
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([...CRITICAL, ...STATIC, './'].map(u => new Request(u, { cache: 'reload' })))
    .then(() => Promise.all(FIREBASE.map(u => fetch(new Request(u, { mode: 'no-cors' })).then(r => c.put(u, r)).catch(() => {}))))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('metatreino-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// só guarda respostas boas: um 404/500 durante a publicação não pode virar a cópia offline.
// "opaque" = scripts do Firebase e fontes de outro domínio (o navegador não mostra o status): continuam
// sendo guardados, senão o app não abriria sem internet.
function guardavel(res) { return !!res && (res.ok || res.type === 'opaque'); }

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // só mexe em arquivos do próprio app e em scripts/fontes estáticas: NUNCA em Firestore/Auth (googleapis.com)
  const okHost = url.origin === self.location.origin || /(^|\.)gstatic\.com$/.test(url.hostname) || url.hostname === 'fonts.googleapis.com';
  if (!okHost) return;
  const path = url.pathname.replace(/^.*\//, './');
  const isCritical = CRITICAL.includes(path) || url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('/app-plus.js') || url.pathname.endsWith('/manifest.json');

  if (isCritical) {
    // Network-first com revalidação forçada (GitHub Pages usa cache HTTP de 10min)
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        if (guardavel(res)) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {}); }
        return res;
      }).catch(() =>
        // Beta 33: sem internet, procura também sem o "?v=..." — a instalação guarda "app.js" e a
        // página pede "app.js?v=2027.1-beta.N". Antes isso não batia e o app abria em branco offline
        // logo depois de uma atualização.
        caches.match(e.request).then(r => r || caches.match(e.request, { ignoreSearch: true }))
          .then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then(r => r || Response.error())
      )
    );
  } else {
    // Cache-first for static assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (guardavel(res)) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {}); }
        return res;
      }))
    );
  }
});
