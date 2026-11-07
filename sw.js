const C = 'kp-v14';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const BASE = new URL('./', self.location).pathname;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // удаляем только свои старые кэши, чужие приложения на этом сайте не трогаем
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kp-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Сначала память телефона (открывается мгновенно и без интернета), обновление подтягивается в фоне.
// Обрабатываем только файлы Сметы: другие приложения в папках сайта (например /shaker/) идут мимо.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  const rel = url.pathname.slice(BASE.length);
  if (rel !== '' && FILES.indexOf(rel) < 0) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(C).then(async cache => {
    const hit = await cache.match(key, { ignoreSearch: true });
    const net = fetch(req, { cache: 'no-cache' }).then(res => { if (res && res.ok) cache.put(key, res.clone()).catch(() => {}); return res; });
    if (hit) { net.catch(() => {}); e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => cache.match('index.html'));
  }));
});
