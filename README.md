# Booklet Creator

Client-side PDF booklet imposition web app built with React, Vite, TypeScript, TailwindCSS, pdf-lib, and PDF.js-ready architecture.

## Features
- Drag-and-drop PDF upload
- True booklet page ordering with blank page insertion
- A4 / Letter paper support
- A5 / A6 target booklet modes
- Duplex/single-sided handling
- RTL booklet toggle support in imposition core
- Margin + gutter-aware fitting
- Client-side PDF generation (no backend)
- Dark mode, responsive UI, keyboard-friendly controls
- GitHub Pages deployment workflow

## Quick Start
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## GitHub Pages
1. Set repository Pages source to **GitHub Actions**.
2. Ensure default branch is `main`.
3. Push to `main`; workflow deploys `dist` automatically.
4. If repo name is not `BookletCreator`, set `VITE_BASE_PATH` in workflow env.

## Print Tips
1. Choose duplex mode where supported.
2. Use short-edge or long-edge flip to match your printer.
3. Fold printed sheets in half and collate signatures.

## Notes
- All PDF processing runs entirely in the browser.
- No files leave the device.
- Vector fidelity is preserved by embedding pages with `pdf-lib`.
