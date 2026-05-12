const CACHE_NAME = "metatreino-cache-v0.5.5-forca-checkin-simple-hotfix";

const APP_SHELL = [
  "./",
  "./index.html?v=0.5.5",
  "./manifest.json?v=0.5.5",
  "./icon-512.png?v=0.5.5"
];

// INSTALACAO
self.addEventListener("install", function(event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

// ATIVACAO - REMOVE CACHES ANTIGOS
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

// PERMITIR ATUALIZACAO IMEDIATA
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// FETCH - HTML SEMPRE TENTA REDE PRIMEIRO; APP SHELL TEM FALLBACK OFFLINE
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // FIX: criar dois clones antes de qualquer consumo do body
          var cloneParaCache1 = response.clone();
          var cloneParaCache2 = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put("./index.html?v=0.5.5", cloneParaCache1);
            cache.put("./index.html", cloneParaCache2);
          });
          return response;
        })
        .catch(function() {
          return caches.match("./index.html?v=0.5.5").then(function(cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  if (
    requestUrl.hostname.includes("firebase") ||
    requestUrl.hostname.includes("googleapis") ||
    requestUrl.hostname.includes("gstatic") ||
    requestUrl.hostname.includes("google.com")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (!response || response.status !== 200) return response;
        var responseCopy = response.clone();
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
