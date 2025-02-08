// Nom du cache
const CACHE_NAME = "vtuber-app-cache-v1";

// Liste des fichiers à mettre en cache initialement (optionnel)
const STATIC_ASSETS = [
    "/",
    "/pages/selection.html",
    "/manifest.json",
    "/loading.css",
    "/script.js",
    "/icons/web-app-manifest-192x192.png",
    "/icons/web-app-manifest-512x512.png"
];

// 📌 Installation du Service Worker et mise en cache des fichiers de base
self.addEventListener("install", event => {
    console.log("Service Worker installé.");
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// 📌 Activation : Nettoyage des anciens caches si nécessaire
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log("Suppression de l'ancien cache :", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 📌 Interception des requêtes et mise en cache dynamique
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    // Stocker seulement les requêtes GET (évite les problèmes avec POST, PUT, etc.)
                    if (event.request.method === "GET") {
                        cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // Optionnel : Retourner une page d'erreur si la requête échoue (ex: mode hors ligne)
            return caches.match("/offline.html");
        })
    );
});
