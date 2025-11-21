// sw.js

// Define a version for the cache. Changing this value will trigger the 'install' event and update the cache.
const CACHE_VERSION = 1;
const CACHE_NAME = `dashboard-cache-v${CACHE_VERSION}`;

// A list of essential files to be pre-cached for the app to work offline.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/components/BookmarkCard.tsx',
  '/components/EditModal.tsx',
  '/components/ProjectCard.tsx',
  '/components/Spinner.tsx',
  'https://icons.iconarchive.com/icons/graphicloads/100-flat/256/home-icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
];

// --- EVENT LISTENERS ---

// 1. Install Event: Fired when the service worker is first installed.
// We use this to pre-cache our essential assets.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event fired.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets.');
        // addAll is atomic: if one asset fails to cache, the entire operation fails.
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        // This ensures the new service worker takes control immediately.
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Caching failed:', error);
      })
  );
});

// 2. Activate Event: Fired when the service worker becomes active.
// We use this to clean up old, unused caches.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache's name is different from our current cache name, it's an old one.
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tell the active service worker to take control of the page immediately.
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Fired for every network request made by the page.
// This is where we implement our caching strategies.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Nur Requests innerhalb des Root-Scopes behandeln (PWA-Isolation)
  if (!request.url.startsWith(self.registration.scope)) {
    return;
  }

  // Strategy for navigation requests (HTML document): Network Falling Back to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If the network request fails (e.g., offline), serve the main page from the cache.
          console.log('[Root SW] Network failed, serving main page from cache.');
          return caches.match('/');
        })
    );
    return;
  }

  // Strategy for all other requests (static assets): Cache, Falling Back to Network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // If we have a response in the cache, return it immediately.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the asset is not in the cache, fetch it from the network.
        return fetch(request).then((networkResponse) => {
          // Clone the response because it's a one-time-use stream.
          const responseToCache = networkResponse.clone();

          // Open our cache and add the newly fetched resource for future requests.
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          // Return the network response to the browser.
          return networkResponse;
        });
      })
      .catch(error => {
        console.error('[Root SW] Fetch failed:', error);
        // Optionally return a fallback asset, e.g., an offline image placeholder.
      })
  );
});
