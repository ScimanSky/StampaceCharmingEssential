const CACHE_NAME = "stampace-essential-v20260610f";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./guest/",
  "./guest/index.html",
  "./host.html",
  "./styles.css?v=20260610f",
  "./host.css?v=20260610f",
  "./app.js?v=20260610f",
  "./host.js?v=20260610f",
  "./content.js?v=20260610f",
  "./supabase.js",
  "./security.js?v=20260610f",
  "./template.json",
  "./manifest.json",
  "./img/app-icon.svg",
  "./img/host-avatar.jpg?v=20260528a",
  "./img/patternlegn.webp",
  "./img/sfondo9.jpeg",
  "./img/flags/it.svg?v=20260604b",
  "./img/flags/gb.svg?v=20260604b",
  "./img/flags/de.svg?v=20260604b",
  "./img/flags/nl.svg?v=20260604b",
  "./img/flags/fr.svg?v=20260604b",
  "./img/flags/es.svg?v=20260604b",
  "./img/flags/pt.svg?v=20260604b",
  "./img/flags/pl.svg?v=20260604b",
  "./img/flags/cs.svg?v=20260604b",
  "./img/flags/ru.svg?v=20260604b",
  "./img/flags/zh.svg?v=20260604b",
  "./img/flags/hi.svg?v=20260604b",
  "./img/flags/ja.svg?v=20260604b",
  "./img/flags/sc.svg?v=20260604b"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

async function networkFirst(request, fallbackUrl = "./index.html") {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || cache.match(fallbackUrl);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, url.pathname.endsWith("/host.html") ? "./host.html" : "./index.html"));
    return;
  }

  if (url.pathname.endsWith("/template.json")) {
    event.respondWith(networkFirst(request, "./template.json"));
    return;
  }

  event.respondWith(cacheFirst(request));
});
