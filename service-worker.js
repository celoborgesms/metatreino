const CACHE_NAME = "metatreino-cache-v0.5.7-cache-reset-hotfix";
const APP_VERSION = "0.5.7";

const APP_SHELL = [
  "./",
  "./index.html?v=0.5.7",
  "./manifest.json?v=0.5.7",
  "./icon-512.png?v=0.5.7"
];

self.addEventListener("install", function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL).catch(function(){ return null; });
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) { return caches.delete(key); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isFirebase = requestUrl.hostname.includes("firebase") ||
    requestUrl.hostname.includes("googleapis") ||
    requestUrl.hostname.includes("gstatic") ||
    requestUrl.hostname.includes("google.com");

  if (isFirebase) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate" || requestUrl.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put("./index.html?v=" + APP_VERSION, clone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match("./index.html?v=" + APP_VERSION).then(function(cached) {
            return cached || caches.match("./index.html") || caches.match("./");
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then(function(response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
        }
        return response;
      })
      .catch(function() { return caches.match(event.request); })
  );
});
