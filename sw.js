const CACHE = "vtuber-link-hub-v1";
const SHELL = [
  "./",
  "index.html",
  "assets/css/v2/base.css",
  "assets/css/v2/shell.css",
  "assets/css/v2/spotlight.css",
  "assets/css/v2/discover.css",
  "assets/css/v2/profile.css",
  "assets/css/v2/info.css",
  "assets/css/v2/responsive.css",
  "assets/css/v2/motion.css",
  "assets/js/v2/app.mjs",
  "assets/js/v2/interactions.mjs",
  "assets/js/v2/core/dom.mjs",
  "assets/js/v2/core/store.mjs",
  "assets/js/v2/views/spotlight.mjs",
  "assets/js/v2/views/discover.mjs",
  "assets/js/v2/views/profile.mjs",
  "assets/js/v2/views/info.mjs",
  "data/spotlight.json",
  "data/events.json",
  "data/discovery-config.json",
  "manifest.json",
  "assets/link.svg",
  "assets/icons/link-192.png",
  "assets/icons/link-512.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("vtuber-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request,
    u = new URL(req.url);
  if (
    req.method !== "GET" ||
    u.origin !== self.location.origin ||
    u.pathname.includes("/archive/")
  )
    return;
  // Offline must never pretend that a Twitch snapshot is current.
  if (u.pathname.endsWith("/data/live.json")) return;
  e.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") return caches.match("index.html");
        return Response.error();
      }),
  );
});
