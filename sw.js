const CACHE_NAME = "my-time-static-v2";
const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // 🚫 NEVER cache API calls
  if (url.pathname.startsWith("/tasks") ||
      url.pathname.startsWith("/timetable") ||
      url.pathname.startsWith("/history") ||
      url.pathname.startsWith("/login")) {
    return; // let network handle it
  }

  // ✅ Cache static files only
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
