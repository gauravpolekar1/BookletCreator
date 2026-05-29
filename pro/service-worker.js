const CACHE_NAME = 'bookletcreator-pro-v0.1.0'
const CORE_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/components.css',
  './js/app.js',
  './js/state.js',
  './js/storage.js',
  './manifest.webmanifest'
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
})
