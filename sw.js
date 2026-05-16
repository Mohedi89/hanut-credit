// Hanouti Pro — Service Worker v4
// يخدم هذا الملف offline على GitHub Pages
const CACHE = 'hanouti-v4';

// الملفات اللي نحفظوهم في الـ cache
const ASSETS = [
  './',
  './index.html'
];

// Install — نحفظ الملفات
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(
        ASSETS.map(url => c.add(new Request(url, {cache: 'reload'})).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// Activate — نمسح الـ cache القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — نرجع من الـ cache لو offline
self.addEventListener('fetch', e => {
  // Navigation requests — نرجع الصفحة من الـ cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          // نحفظ أحدث نسخة من الصفحة
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match('./') || caches.match('./index.html'))
    );
    return;
  }

  // باقي الـ requests — Cache First
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => null);
    })
  );
});

// Push Notifications
self.addEventListener('push', e => {
  const d = e.data?.json() || {title: 'Hanouti Pro', body: 'Notification'};
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: '/icon.svg',
      tag: d.tag || 'hanouti',
      vibrate: [200, 100, 200]
    })
  );
});
