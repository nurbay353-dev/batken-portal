// Батken Portal — service worker
// Статикалык файлдарды гана кэштейт. Firestore/Firebase суроо-талаптарына тийбейт.

const CACHE_NAME = "batken-portal-v1";

const STATIC_ASSETS = [
  "/batken-portal/",
  "/batken-portal/index.html",
  "/batken-portal/manifest.json",
  "/batken-portal/icon-192.png",
  "/batken-portal/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Firebase/Firestore жана башка тышкы API суроо-талаптарын кармаба —
  // алар түз тармактан өтсүн (реалдуу-убакыт маалымат үчүн керек)
  const isExternalOrApi =
    url.origin !== self.location.origin ||
    url.hostname.includes("firestore") ||
    url.hostname.includes("firebaseio") ||
    url.hostname.includes("googleapis");

  if (isExternalOrApi || event.request.method !== "GET") {
    return; // тармактан түз өткөр
  }

  // Статикалык файлдар: cache-first, тармактан жаңыртып туруу менен
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // оффлайн болсо — кэштен бер

      return cached || networkFetch;
    })
  );
});
