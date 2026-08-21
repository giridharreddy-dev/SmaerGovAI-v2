const CACHE_NAME = 'smartgov-health-v7';
const OFFLINE_URL = '/offline.html';

// Files to cache on install — all app-shell assets
const STATIC_CACHE_FILES = [
  '/',
  '/offline.html',
  '/public/css/theme.css',
  '/public/manifest.webmanifest',
  '/public/assets/icon.svg',
  '/public/js/i18n.js',
  '/public/js/app-client.js',
  '/public/assets/leaflet/leaflet.js',
  '/public/assets/leaflet/leaflet.css',
  '/api/facilities',
  '/healthz',
  '/public/audio/14416-17277d.mp3',
  '/public/audio/abha-b6df72.mp3',
  '/public/audio/anaemia-mukt-bharat-5ef704.mp3',
  '/public/audio/ap-104-mobile-medical-units-933298.mp3',
  '/public/audio/ap-108-emergency-ambulance-service-f27a14.mp3',
  '/public/audio/ap-blood-bank-services-ce0501.mp3',
  '/public/audio/ap-cashless-hospital-care-d89e17.mp3',
  '/public/audio/ap-free-dialysis-and-ckd-financial-aid-scheme-ff8887.mp3',
  '/public/audio/ap-thalassaemia-and-haemophilia-financial-aid-sche-59e0d9.mp3',
  '/public/audio/child-health-screening-08e444.mp3',
  '/public/audio/child-hearing-restoration-bed898.mp3',
  '/public/audio/comprehensive-universal-eye-care-f132ee.mp3',
  '/public/audio/doorstep-health-screening-specialist-camps-ad01c5.mp3',
  '/public/audio/esanjeevani-national-telemedicine-service-ac8f9c.mp3',
  '/public/audio/free-delivery-care-0a539e.mp3',
  '/public/audio/free-primary-health-care-d3c746.mp3',
  '/public/audio/icds-7459d4.mp3',
  '/public/audio/jeevandan-983fc6.mp3',
  '/public/audio/mission-indradhanush-universal-immunization-b62857.mp3',
  '/public/audio/nacp-59d62b.mp3',
  '/public/audio/national-health-cover-578f48.mp3',
  '/public/audio/national-oral-health-programme-8c89b4.mp3',
  '/public/audio/national-sickle-cell-anaemia-elimination-mission-2f6a48.mp3',
  '/public/audio/niddcp-64cc31.mp3',
  '/public/audio/nlep-e4d92d.mp3',
  '/public/audio/nmhp-bf7299.mp3',
  '/public/audio/notp-704925.mp3',
  '/public/audio/npcbvi-238fed.mp3',
  '/public/audio/nphce-91674a.mp3',
  '/public/audio/nppcd-337b02.mp3',
  '/public/audio/nrcp-5441e8.mp3',
  '/public/audio/ntcp-fdcc18.mp3',
  '/public/audio/ntep-2e5785.mp3',
  '/public/audio/nvbdcp-6f8761.mp3',
  '/public/audio/pmbjp-fa1dd8.mp3',
  '/public/audio/pmmvy-1248b1.mp3',
  '/public/audio/pmsma-28289e.mp3',
  '/public/audio/poshan-abhiyaan-93e05a.mp3',
  '/public/audio/post-operative-financial-allowance-f0e602.mp3',
  '/public/audio/pradhan-mantri-national-dialysis-programme-eb8b56.mp3',
  '/public/audio/safe-motherhood-cash-support-ee1905.mp3',
  '/public/audio/tb-nutrition-support-afb4b6.mp3',
  '/public/audio/testscheme-350540.mp3',
  '/public/audio/ysr-urban-health-clinics-41e480.mp3',
  '/public/audio/ysr-village-health-clinics-e067b5.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Handle HTML pages, JSON APIs, and static assets
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      event.request.destination === 'audio' ||
      url.pathname.endsWith('.json')) {
    
    // Stale-While-Revalidate strategy: serve from cache, update in background
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });

        // Return cached immediately, or fetch if not cached
        return cached || fetchPromise;
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
        // Return a default response for other asset types
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
  } else {
    // For API and other requests: Network First, then exact cache, then fallback to base cache (for /api/)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
            return caches.match(event.request).then(cached => {
                if (cached) return cached;
                // Fallback to base API URL if offline and exact query isn't cached
                if (url.pathname.startsWith('/api/')) {
                    return caches.match(url.pathname);
                }
                return null;
            });
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_ALL_AUDIO') {
    cacheAllAudio();
  }
});

async function cacheAllAudio() {
  try {
    const response = await fetch('/offline-cache');
    const data = await response.json();
    const cache = await caches.open(CACHE_NAME);
    
    // Cache the schemes data JSON payload
    cache.put('/offline-cache', new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    }));
    
    // Cache individual scheme voice/audio URLs if available
    const schemes = data.schemes_list || {};
    for (const [name, scheme] of Object.entries(schemes)) {
      if (scheme.voice_url) {
        try {
          await cache.add(scheme.voice_url);
        } catch (e) {
          // Skip audio files that fail to cache (not yet generated, etc.)
        }
      }
    }

    console.log('✅ Offline cache updated with scheme data and audio');
  } catch (error) {
    console.warn('Failed to update offline cache:', error);
  }
}
