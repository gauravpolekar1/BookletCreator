# BookletCreator Pro

BookletCreator Pro is a separate, static, privacy-first workspace that lives beside the classic BookletCreator page. Phase 1 provides the foundation: tab routing, observable project state, unit selection, PDF ingestion through pdf.js, local IndexedDB persistence, and `.bcproj` project import/export.

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
- `js/app.js` wires routing, PDF ingestion, project import/export, and rendering.

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
5. When Phase 5 lands, register or load the template through `js/content-in/templates.js`.

## Adding a new imposition mode

1. Add a file under `pro/js/imposition/`.
2. Export a single async function with this signature:

   ```js
   export async function impose(sourcePdfBytes, options) {
     return new Uint8Array()
   }
   ```

3. Register the mode in `js/app.js` once Phase 2 routing and processing controls are implemented.
4. Add browser-runnable tests under `pro/tests/` when the imposition test harness is introduced in Phase 2.

## Adding a new print shop profile

1. Add profile data in `pro/js/workflow/profiles.js` once Phase 7 is active.
2. Include sheet size, bleed, marks style, color mode, and file naming pattern.
3. Link to the print shop's published specification in a code comment.
4. Keep custom profiles local to IndexedDB; do not add telemetry or account requirements.

## Implemented vs. deferred

Implemented in v0.1.0:

- Phase 1 central observable project state.
- Phase 1 IndexedDB project save/load/list/delete.
- Phase 1 `.bcproj` import/export with optional embedded PDF bytes.
- Phase 1 unit toggle shared across UI rendering.
- Phase 1 tabbed shell with hash routing and last-tab persistence.
- Phase 1 source PDF ingestion, metadata extraction, and first-page preview.
- Persistent privacy badge.

Deferred by design:

- Phases 2–8 feature implementations. Their folders and placeholder files exist so future work can proceed without moving code, but this iteration stops after Phase 1 as requested.
