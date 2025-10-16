// Service Worker for SPIDEY OFFICIAL
const CACHE_NAME = 'spidey-official-v2.0.0';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/downloader.js',
    '/js/animations.js',
    '/js/ui-effects.js',
    '/js/particles.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
        )
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});