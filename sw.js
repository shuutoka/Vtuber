const CACHE = 'vtuber-link-v3';
const SHELL = ['./','index.html','profile.html','assets/css/site.css','assets/js/app.js','assets/js/profile.js','data/creators.json','data/events.json','manifest.json'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Ne jamais servir les statuts Twitch depuis un cache persistant.
  if (new URL(req.url).pathname.endsWith('/data/live.json')) return;
  if (req.mode === 'navigate') event.respondWith(fetch(req).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  else event.respondWith(fetch(req).catch(() => caches.match(req)));
});
