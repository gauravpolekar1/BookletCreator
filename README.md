# Printing & Booklet Specialist

Premium, privacy-first print layout studio for physical PDF workflows. The app runs **100% in your browser**, supports booklet/signature/zine use-cases, and is deployable directly to GitHub Pages.

## Core Positioning
- Files never leave your browser
- 100% client-side processing (no backend)
- Works offline (PWA)
- Designed for real-world printing and duplex workflows
- Open-source friendly static deployment

## Modules
1. Booklet Creator (flagship)

## Stack
React + Vite + TypeScript + TailwindCSS + PDF-LIB + PDF.js + dnd-kit + Framer Motion + vite-plugin-pwa.

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## GitHub Pages Deployment
1. Enable **GitHub Actions** as Pages source.
2. Push to `main`.
3. Workflow `.github/workflows/deploy.yml` builds and deploys static `dist`.
4. `VITE_BASE_PATH` is automatically set to `/${repo-name}/` during CI.

## Privacy
All PDF processing is done locally in-browser. No upload endpoint, cloud storage, or auth flow is used.
