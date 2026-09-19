// GymTimer service worker. Vanilla JS — Next 16 has no built-in SW; this
// gives the site "installable" PWA status + offline fallback for navigation.
// Strategy: precache the offline shell, network-first for navigation,
// stale-while-revalidate for previously-seen same-origin assets. SWR (not
// cache-first) matters here: in dev the chunk URLs are stable and in prod a
// deploy can rewrite assets — cache-first served the OLD build forever until
// a hard refresh, which showed stale sections after every code change.

const CACHE_NAME = "gymtimer-v2";
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

  // Static assets: stale-while-revalidate. Serve the cached copy instantly,
  // then refresh it from the network in the background so an edited build
  // (same URL in dev, hashed-but-rewritten in prod) replaces the stale copy
  // on the next load instead of requiring a hard refresh.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = (await cache.match(req)) as Response | undefined;
      const network = fetch(req).then((res) => {
        if (res.ok) void cache.put(req, res.clone());
        return res;
      });
      if (cached) {
        // Serve from cache now; let the background revalidation finish on
        // its own (a failed refresh leaves the cached copy in place).
        network.catch(() => {});
        return cached;
      }
      try {
        return await network;
      } catch {
        return Response.error();
      }
    })()
  );
});
