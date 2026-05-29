const CACHE_NAME = 'bookletcreator-pro-v0.1.0'
const CORE_ASSETS = [
  './',
  './CHANGELOG.md',
  './DEPENDENCIES.md',
  './README.md',
  './css/components.css',
  './css/main.css',
  './index.html',
  './js/app.js',
  './js/content-in/docx-to-pdf.js',
  './js/content-in/images-to-pdf.js',
  './js/content-in/markdown-to-pdf.js',
  './js/content-in/templates.js',
  './js/cover-designer/designer.js',
  './js/cover-designer/templates.js',
  './js/imposition/bi-fold.js',
  './js/imposition/n-up.js',
  './js/imposition/perfect-bound.js',
  './js/imposition/saddle-stitch.js',
  './js/imposition/tri-fold.js',
  './js/layout/gutter.js',
  './js/layout/headers-footers.js',
  './js/layout/page-numbers.js',
  './js/layout/toc.js',
  './js/layout/watermark.js',
  './js/preview/flipbook.js',
  './js/print-prep/bleed.js',
  './js/print-prep/grayscale.js',
  './js/print-prep/marks.js',
  './js/print-prep/preflight.js',
  './js/print-prep/spine-calc.js',
  './js/state.js',
  './js/storage.js',
  './js/workers/imposition-worker.js',
  './js/workers/preflight-worker.js',
  './js/workflow/batch.js',
  './js/workflow/presets.js',
  './js/workflow/profiles.js',
  './manifest.webmanifest',
  './templates/childrens-square-sample.md',
  './templates/childrens-square.json',
  './templates/cookbook-sample.md',
  './templates/cookbook.json',
  './templates/manual-5.5x8.5-sample.md',
  './templates/manual-5.5x8.5.json',
  './templates/novel-6x9-sample.md',
  './templates/novel-6x9.json',
  './templates/photo-book-sample.md',
  './templates/photo-book.json',
  './templates/sermon-notes-sample.md',
  './templates/sermon-notes.json',
  './templates/wedding-program-sample.md',
  './templates/wedding-program.json',
  './templates/worksheet-a4-sample.md',
  './templates/worksheet-a4.json',
  './templates/zine-half-letter-sample.md',
  './templates/zine-half-letter.json',
  './tests/imposition.test.js',
  './tests/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs',
  'https://unpkg.com/idb@8.0.2/build/index.js?module',
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/markdown-it/14.1.0/markdown-it.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.min.js',
  'https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js',
  'https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
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
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone()
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
    return response
  })))
})
