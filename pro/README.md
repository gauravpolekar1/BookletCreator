# BookletCreator Pro

BookletCreator Pro is a separate, static, privacy-first workspace that lives beside the classic BookletCreator page. The current Pro page provides a no-build, client-side print workspace: project state, PDF ingestion, imposition, print prep, layout finishing, cover design, preview, export, projects, presets, profiles, and browser-runnable imposition tests.

## Local development

No build step is required.

1. Clone the repository.
2. Open `pro/index.html` directly in a modern browser, or serve the repository root with any static file server.
3. Upload a PDF on the **Start** tab. The file is parsed locally in the browser and is not uploaded anywhere.

The page uses vanilla ES modules and pinned CDN libraries documented in `DEPENDENCIES.md`.

## Structure

- `index.html` contains the Pro shell, tab panels, upload controls, project controls, and inspector pane.
- `css/main.css` defines layout, theme custom properties, dark-mode support, and responsive regions.
- `css/components.css` defines reusable controls, cards, tabs, the upload zone, and toast notifications.
- `js/state.js` is the central observable state store and unit conversion source of truth.
- `js/storage.js` wraps IndexedDB through `idb` for project persistence.
- `js/app.js` wires routing, PDF ingestion, print-workflow actions, project import/export, and rendering.

## Adding a new template

1. Add a JSON file to `pro/templates/`.
2. Use a stable kebab-case filename, for example `technical-manual.json`.
3. Include at least:
   - `id`
   - `name`
   - `pageSize`
   - `margins`
   - `defaultFonts`
   - `defaultStyles`
   - `sample`
4. Add a matching sample Markdown file if the template needs first-run content.
5. Add the filename to `templateFiles` in `js/content-in/templates.js` so the Start/content-in workflow can load it.

## Adding a new imposition mode

1. Add a file under `pro/js/imposition/`.
2. Export a single async function with this signature:

   ```js
   export async function impose(sourcePdfBytes, options) {
     return new Uint8Array()
   }
   ```

3. Register the mode in the mode runner map in `js/app.js`.
4. Add browser-runnable tests under `pro/tests/` using the inline harness.

## Adding a new print shop profile

1. Add profile data in `pro/js/workflow/profiles.js`.
2. Include sheet size, bleed, marks style, color mode, and file naming pattern.
3. Link to the print shop's published specification in a code comment.
4. Keep custom profiles local to IndexedDB; do not add telemetry or account requirements.

## Implemented vs. deferred

Implemented in v0.1.0:

- Phase 1 central observable project state, IndexedDB storage, `.bcproj` import/export, unit toggle, tab shell, source PDF ingestion, and privacy badge.
- Phase 2 imposition modules for saddle stitch, perfect-bound signatures, bi-fold, tri-fold, and N-up.
- Phase 3 print-prep modules for bleed, print marks, spine calculation, grayscale passthrough, and preflight reporting.
- Phase 4 layout modules for page numbers, headers/footers, TOC insertion, gutter shift, and watermarks.
- Phase 5 content-in modules and bundled templates with sample Markdown.
- Phase 6 Fabric.js cover-designer integration.
- Phase 7 PageFlip preview, presets, profiles, batch ZIP export, and file naming.
- Phase 8 PWA manifest/service worker, responsive UI, ARIA labels, and keyboard-accessible controls.

Deferred by design:

- Advanced production-grade analysis such as true embedded image DPI extraction, transparency introspection, and fully rasterized grayscale conversion are represented by safe client-side baseline implementations and can be deepened without changing the no-build architecture.
