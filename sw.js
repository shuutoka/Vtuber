const CACHE_NAME = "vtuber-app-v2";
const CORE_ASSETS = [
  "index.html",
  "manifest.json",
  "pages/selection.html",
  "pages/loading.css",
  "icons/web-app-manifest-192x192.png",
  "icons/web-app-manifest-512x512.png",
  "icons/favicon.ico"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first pour les navigations, cache-first pour le reste
self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(resp => {
        caches.open(CACHE_NAME).then(c => c.put(req, resp.clone()));
        return resp;
      }).catch(async () => {
        return (await caches.match(req)) || caches.match("index.html");
      })
    );
    return;
  }

  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(resp => {
          caches.open(CACHE_NAME).then(c => c.put(req, resp.clone()));
          return resp;
        }).catch(() => caches.match("pages/selection.html"));
      })
    );
  }
});
