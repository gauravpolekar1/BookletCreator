# BookletCreator Pro dependencies

All Pro dependencies are browser-loaded, version-pinned CDN files. There is no bundler or build step.

| Concern | Library | Version | Source | Phase |
|---|---:|---:|---|---|
| PDF rendering | pdf.js | 4.10.38 | cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs` | Phase 1 |
| PDF rendering worker | pdf.js worker | 4.10.38 | cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs` | Phase 1 |
| Local storage | idb | 8.0.2 | unpkg: `https://unpkg.com/idb@8.0.2/build/index.js?module` | Phase 1 |
| PDF manipulation | pdf-lib | 1.17.1 | unpkg: `https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js` | Deferred to Phase 2 |
| Markdown parsing | markdown-it | 14.1.0 | cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/markdown-it/14.1.0/markdown-it.min.js` | Deferred to Phase 5 |
| MD → PDF | pdfmake | 0.2.20 | cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.20/pdfmake.min.js` | Deferred to Phase 5 |
| DOCX → HTML | mammoth.js | 1.8.0 | unpkg: `https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js` | Deferred to Phase 5 |
| Canvas editor | fabric.js | 5.3.1 | cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js` | Deferred to Phase 6 |
| Flipbook preview | PageFlip | 2.0.7 | unpkg: `https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js` | Deferred to Phase 7 |
| Zip output | JSZip | 3.10.1 | cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` | Deferred to Phase 7 |

Only Phase 1 dependencies are loaded by `/pro/index.html` today to avoid unused runtime code and keep the empty Pro page quiet.
