const CACHE_NAME = "bi1gestion-cache-v1";
const API_CACHE_NAME = "bi1gestion-api-cache-v1";

const APP_SHELL = ["/", "/admin", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const hasAuthHeader = !!event.request.headers.get("authorization");

  // Cache-first for static assets
  if (event.request.method === "GET" && url.origin === self.location.origin && url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for key APIs used by display mode
  const apiPaths = ["/api/slides", "/api/settings", "/api/weather", "/api/birthdays"];
  if (event.request.method === "GET" && url.origin === self.location.origin && apiPaths.includes(url.pathname)) {
    // Ne jamais servir le cache pour les requêtes admin authentifiées
    if (hasAuthHeader) {
      event.respondWith(fetch(event.request));
      return;
    }

    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        try {
          // Network-first pour afficher les dernières données sans refresh.
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          throw new Error("Offline and no cache available");
        }
      })
    );
  }
});
