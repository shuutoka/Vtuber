const CACHE_NAME = "vtuber-app-cache-v1";
const STATIC_ASSETS = [
    "/",
    "/pages/selection.html",
    "/manifest.json",
    "/loading.css",
    "/script.js",
    "/icons/web-app-manifest-192x192.png",
    "/icons/web-app-manifest-512x512.png"
];

// 📌 Installation du Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// 📌 Activation et suppression des anciens caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 📌 Gestion dynamique du cache et de la navigation
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    if (event.request.method === "GET") {
                        cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        }).catch(() => {
            return caches.match("/pages/selection.html"); // Redirige vers selection.html si hors ligne
        })
    );
});
