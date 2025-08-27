


const CACHE_NAME = 'axismea-cache-v9';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './metadata.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  
  // Icons
  './assets/icons/icon.png',
  
  // Components
  './components/AnalysisSidebar.tsx',
  './components/AppFormModal.tsx',
  './components/AppsView.tsx',
  './components/AuriMeaView.tsx',
  './components/BackupModal.tsx',
  './components/BookmarkFormModal.tsx',
  './components/BookmarkItemCard.tsx',
  './components/BottomNavigation.tsx',
  './components/CalendarWeatherModal.tsx',
  './components/CollMeaView.tsx',
  './components/CollectionFormModal.tsx',
  './components/CompletedTasksModal.tsx',
  './components/ContextMenu.tsx',
  './components/DetailedCalendar.tsx',
  './components/DetailedWeather.tsx',
  './components/HolidayDetailModal.tsx',
  './components/JournalEntryCard.tsx',
  './components/MemoMeaExportModal.tsx',
  './components/MemoMeaView.tsx',
  './components/MyProjectsOverview.tsx',
  './components/PieChart.tsx',
  './components/PlaceholderView.tsx',
  './components/ReadLateRView.tsx',
  './components/TransactionFormModal.tsx',
  './components/MetroView.tsx',
  './components/NotificationModal.tsx',
  './components/SidebarInfoWidget.tsx',
  
  // Hooks
  './hooks/useApps.ts',
  './hooks/useBookmarks.ts',
  './hooks/useCollections.ts',
  './hooks/useHistoryStack.ts',
  './hooks/useJournal.ts',
  './hooks/useMediaQuery.ts',
  './hooks/useNavigation.ts',
  './hooks/useTiles.ts',
  './hooks/useUIState.ts',

  // Data
  './data/apps.ts',
  './data/bookmarks.ts',
  './data/collections.ts',
  './data/categories.ts',
  './data/transactions.ts',
  
  // Utils
  './utils/holidays.ts',
  './utils/weather.ts',
  
  // External assets
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://cdn2.iconfinder.com/data/icons/illustricon-tech-vii/512/big_data-512.png'

  // ESM modules like react, chart.js etc. will be cached dynamically by the fetch handler
];


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Robust Stale-While-Revalidate strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
      return;
  }
  
  const url = new URL(event.request.url);
  // Do not cache freegeoip or open-meteo requests
  if (url.hostname === 'freegeoip.app' || url.hostname === 'api.open-meteo.com') {
      return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            // Do not cache external API/proxy responses
            if (!event.request.url.includes('api.microlink.io')) {
              cache.put(event.request, networkResponse.clone());
            }
          }
          return networkResponse;
        });

        // Return cached response if we have one, otherwise wait for the network response.
        return response || fetchPromise;
      });
    })
  );
});