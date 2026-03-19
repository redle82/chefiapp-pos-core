/**
 * ChefIApp POS — Service Worker
 *
 * Strategy:
 * - Cache-first for static assets (JS, CSS, images, fonts)
 * - Network-first for API calls (with stale fallback)
 * - Offline fallback page for navigation requests
 * - Cache versioning with automatic cleanup
 * - Skip waiting on update
 */

const CACHE_VERSION = 'chefiapp-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

/** Static asset extensions that benefit from cache-first. */
const STATIC_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.ico',
];

/** API path prefixes that use network-first with stale fallback. */
const API_PREFIXES = ['/rest/', '/rpc/', '/api/'];

/** Paths that should never be cached. */
const NEVER_CACHE = ['/internal/', '/webhooks/', '/realtime/'];

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Pre-cache the offline fallback shell
      return cache.addAll(['/']);
    }).catch(() => {
      // Non-fatal: offline fallback is best-effort
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old versioned caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
            .map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

// ─── Message handling ─────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'DEV_SW_DISABLE') {
    // Dev mode: unregister self
    self.registration.unregister();
  }
});

// ─── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never cache internal/webhook/realtime paths
  if (NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))) return;

  // Navigation requests: network-first with offline fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // API requests (GET only): network-first with stale fallback
  if (
    request.method === 'GET' &&
    API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Static assets: cache-first
  if (
    request.method === 'GET' &&
    isStaticAsset(url.pathname)
  ) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Navigation: try network, fall back to cached `/` (SPA shell).
 */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put('/', response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match('/');
    if (cached) return cached;
    // Last resort: a simple offline page
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ChefIApp - Offline</title></head>' +
      '<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fafafa;font-family:system-ui">' +
      '<div style="text-align:center;padding:2rem"><p style="font-size:2rem">Offline</p>' +
      '<p style="color:#71717a">Check your connection and try again.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 503 }
    );
  }
}

/**
 * API (GET): try network with 10s timeout, fall back to cache.
 */
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Static assets: cache-first, update cache in background.
 */
async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    // Refresh cache in background (stale-while-revalidate)
    fetch(request)
      .then((response) => {
        if (response.ok) cache.put(request, response);
      })
      .catch(() => { /* offline, keep stale */ });
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}
