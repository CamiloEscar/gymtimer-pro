// GymTimer service worker. Vanilla JS — Next 16 has no built-in SW; this
// gives the site "installable" PWA status + offline fallback for navigation.
// Strategy is intentionally minimal: precache the offline shell, network-
// first for navigation, cache-first for previously-seen same-origin assets.

const CACHE_NAME = "gymtimer-v1";
const PRECACHE_URLS = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only handle same-origin requests; third-party (Pusher, font CDN if any)
  // passes through untouched.
  if (url.origin !== self.location.origin) return;

  // Navigation requests: try network, fall back to cached /offline shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/offline")) ?? Response.error();
      })
    );
    return;
  }

  // Static assets: cache-first, fall back to network. Good enough for v1;
  // upgrade to stale-while-revalidate when cache churn becomes a concern.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return cached ?? Response.error();
      }
    })()
  );
});
