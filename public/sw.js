// Tools PWA Service Worker
// Version: 1.0.0

const CACHE_NAME = 'tools-pwa-v1';
const RUNTIME_CACHE = 'tools-runtime-v1';

// Core assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/favicon.png'
];

// Install event - precache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Precaching core assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                console.log('[SW] Deleting old cache:', cacheToDelete);
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

// Fetch event - cache-first for assets, network-first for navigation
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and external requests
    if (request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // Navigation requests - network first, fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache the latest version
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(cachedResponse => {
                            return cachedResponse || caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // Static assets - cache first, then network
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then(response => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Cache the fetched response
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        // Cache JS, CSS, and other static assets
                        if (url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)) {
                            cache.put(request, responseToCache);
                        }
                    });

                    return response;
                });
            })
    );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
