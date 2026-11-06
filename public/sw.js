// Grain Photo Engine Service Worker for Chrome PWA Installability

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Optional fetch passthrough (Network first, zero stale caching on live drive data)
self.addEventListener('fetch', (event) => {
  // Let browser handle normal navigation and media streaming
});
