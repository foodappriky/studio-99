// Studio 99 — minimalni service worker (omogućuje "Instaliraj aplikaciju"). Ništa ne sprema u cache.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
