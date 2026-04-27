const CACHE_NAME = "metatreino-cache-v1.3.1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png.png"
];

self.addEventListener("install", function(event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

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

self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

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