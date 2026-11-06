const C = 'kp-v12';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Сначала память телефона (открывается мгновенно и без интернета), обновление подтягивается в фоне
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(C).then(async cache => {
    const hit = await cache.match(key, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(key, res.clone()).catch(() => {}); return res; });
    if (hit) { net.catch(() => {}); e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => cache.match('index.html'));
  }));
});
