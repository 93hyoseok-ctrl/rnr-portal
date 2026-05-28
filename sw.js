const CACHE = 'rnr-portal-v4';

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(APP_SHELL.map(url => c.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 페이지 요청 → 캐시 우선, 오프라인에서도 열림
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/').then(cached => {
        if (cached) {
          // 백그라운드에서 최신 버전 갱신
          fetch(e.request).then(res => {
            if (res.ok) caches.open(CACHE).then(c => c.put('/', res.clone()));
          }).catch(() => {});
          return cached;
        }
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put('/', res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // 정적 자원 → 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => new Response('', { status: 404 }));
    })
  );
});
