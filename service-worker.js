const CACHE_PREFIX = "zeiterfassung-cache-";
const CACHE_VERSION = "v58";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./translations.js",
  "./app.js",
  "./README.md",
  "./version.json",
  "./manifest.webmanifest",
  "./icons/app-icon.svg",
  "./icons/kofi-button.svg",
  "./icons/zeiterfassung-share-qr.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

function networkFirst(request, fallbackRequest = request) {
  return fetch(request)
    .then((response) => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || caches.match(fallbackRequest)));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, "./index.html"));
    return;
  }

  if (requestUrl.pathname.endsWith("/README.md") || requestUrl.pathname.endsWith("/version.json")) {
    event.respondWith(networkFirst(
      event.request,
      requestUrl.pathname.endsWith("/version.json") ? "./version.json" : "./README.md"
    ));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(networkFirst(event.request, "./index.html"));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "./", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      if (matchingClient) {
        return matchingClient.focus().then(() => {
          if ("navigate" in matchingClient) {
            return matchingClient.navigate(targetUrl);
          }
          return undefined;
        });
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
