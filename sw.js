const CACHE_NAME = 'linksammlung-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/appdrawer.html',
  '/agenda.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  '/assets/web-widgets.png',
  '/assets/web-rssreader.png',
  '/assets/web-readlater.png',
  '/assets/web-memomea.png',
  '/assets/web-habitmea.png',
  '/assets/web-aurimea.png',
  '/assets/web-actamea.png',
  '/assets/web-jap_mentor.png',
  '/assets/web-fitness_data.png',
  '/assets/web-discere.png',
  '/assets/web-unicorn.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});