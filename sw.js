self.addEventListener("install", event => {
    console.log("Service Worker installé.");
    event.waitUntil(
        caches.open("v1").then(cache => {
            return cache.addAll([
                "/",
                "/pages/selection",
                "/vtuber/",
                "/manifest.json",
                "/loading.css",
                "/script.js",
                "/icons/web-app-manifest-192x192.png",
                "/icons/web-app-manifest-512x512.png"
            ]);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
