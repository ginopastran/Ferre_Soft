// @ts-ignore
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

// Inicializar workbox
workbox.setConfig({
  debug: false,
});

const {
  routing: { registerRoute, NavigationRoute },
  strategies: { NetworkFirst, CacheFirst, StaleWhileRevalidate },
  expiration: { ExpirationPlugin },
  cacheableResponse: { CacheableResponsePlugin },
  precaching: { precacheAndRoute },
} = workbox;

// Eliminar la declaración de tipos de TypeScript
// declare let self: ServiceWorkerGlobalScope;

// Rutas principales a precachear
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/login",
  "/_next/static/css/app.css",
  "/_next/static/chunks/main.js",
];

// Un solo evento install
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open("app-shell").then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      }),
      caches.open("offline-credentials").then((cache) => {
        return cache.addAll(["/login", "/offline"]);
      }),
    ])
  );
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Cache para navegación con fallback a offline
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "pages-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
        }),
      ],
    }),
    {
      denylist: [/\/api\/.*/], // Excluir endpoints de API
    }
  )
);

// Cache para APIs
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache para imágenes y otros recursos estáticos
registerRoute(
  ({ request }) =>
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script",
  new CacheFirst({
    cacheName: "assets",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Para requests de navegación
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).catch(() => {
            return caches.match("/offline");
          })
        );
      })
    );
    return;
  }

  // Para requests de API
  if (request.url.includes("/api/")) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).catch(() => {
            // Retornar datos en cache para APIs
            if (request.url.includes("/api/productos")) {
              return caches.match("/api/productos");
            }
            return new Response(JSON.stringify({ error: "offline" }));
          })
        );
      })
    );
    return;
  }

  // Para otros recursos
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});
