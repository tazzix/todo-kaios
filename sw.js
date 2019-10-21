(
    () => {
        const cacheName = 'todokaipwa-v1';
        const staticAssets = [
        '/',
        '/resources/css/reset.min.css',
        '/resources/css/style.css',
        '/resources/css/softkey.css',
        '/resources/js/main.js'
        ];

        self.addEventListener('install', async function () {
            const cache = await caches.open(cacheName);
            cache.addAll(staticAssets);
        });
    
        // Activate event
        // Be sure to call self.clients.claim()
        self.addEventListener('activate', function(event) {
        // `claim()` sets this worker as the active worker for all clients that
        // match the workers scope and triggers an `oncontrollerchange` event for
        // the clients.
        return self.clients.claim();
        });

        self.addEventListener('fetch', event => {
            const request = event.request;
            const url = new URL(request.url);
            if (url.origin === location.origin) {
                event.respondWith(cacheFirst(request));
            } else {
                event.respondWith(networkFirst(request));
            }
        });
    
        async function cacheFirst(request) {
            const cachedResponse = await caches.match(request);
            return cachedResponse || fetch(request);
        }
    
        async function networkFirst(request) {
            const dynamicCache = await caches.open('news-dynamic');
            try {
                const networkResponse = await fetch(request);
                dynamicCache.put(request, networkResponse.clone());
                return networkResponse;
            } catch (err) {
                const cachedResponse = await dynamicCache.match(request);
                return cachedResponse || await caches.match('./fallback.json');
            }
        }
    }
)();