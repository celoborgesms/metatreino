const CACHE_NAME = "metatreino-cache-v0.0.5-conquistas-plus-index-dividido";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png.png",
  "./css/styles.css",
  "./js/app.js"
];

// INSTALAÇÃO
self.addEventListener("install", function(event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

// ATIVAÇÃO (REMOVE CACHE ANTIGO)
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// PERMITIR ATUALIZAÇÃO IMEDIATA
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// FETCH (ESTRATÉGIA INTELIGENTE)
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Navegação (index.html)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put("./index.html", copy);
          });
          return response;
        })
        .catch(function() {
          return caches.match("./index.html");
        })
    );
    return;
  }

  // Firebase / Google APIs (sempre online)
  if (
    requestUrl.hostname.includes("firebase") ||
    requestUrl.hostname.includes("googleapis") ||
    requestUrl.hostname.includes("gstatic") ||
    requestUrl.hostname.includes("google.com")
  ) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Demais arquivos
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseCopy);
        });

        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});