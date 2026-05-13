const CACHE_NAME = "metatreino-cache-v0.6.5-demos-botao-local";

const APP_SHELL = [
  "./",
  "./index.html?v=0.6.5",
  "./manifest.json?v=0.6.5",
  "./icon-512.png.png?v=0.6.5",
  "./assets/demos/squat-loop.webm",
  "./assets/demos/squat-loop.mp4",
  "./assets/demos/squat-poster.jpg",
  "./assets/demos/row-loop.webm",
  "./assets/demos/row-loop.mp4",
  "./assets/demos/row-poster.jpg",
  "./assets/demos/bench-loop.webm",
  "./assets/demos/bench-loop.mp4",
  "./assets/demos/bench-poster.jpg",
  "./assets/demos/calf-loop.webm",
  "./assets/demos/calf-loop.mp4",
  "./assets/demos/calf-poster.jpg",
  "./assets/demos/plank-loop.webm",
  "./assets/demos/plank-loop.mp4",
  "./assets/demos/plank-poster.jpg"
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
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put("./index.html?v=0.6.5", copy);
            cache.put("./index.html", response.clone());
          });
          return response;
        })
        .catch(function() {
          return caches.match("./index.html?v=0.6.5").then(function(cached) {
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
