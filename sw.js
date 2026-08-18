// Service Worker — Tableau d'échange (Club Réussir Ensemble)
const CACHE_NAME = 'tableau-echange-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord (données toujours à jour), repli sur le cache
// si hors-ligne — utile pour l'écran de connexion / rôle.
//
// NB : les requêtes vers un autre domaine (Firebase Storage, Firestore,
// YouTube...) et les requêtes "Range" (lecture vidéo par morceaux) ne sont
// PAS interceptées ici. Elles sont laissées au réseau normal, et la mise en
// cache des vidéos/fiches déjà consultées est gérée séparément côté page
// (Cache Storage dédié), pour éviter de corrompre la lecture vidéo avec des
// réponses partielles mises en cache sous une URL complète.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req))
  );
});

