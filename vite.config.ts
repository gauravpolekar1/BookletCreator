import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const basePath = process.env.VITE_BASE_PATH || '/BookletCreator/';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function copyProWorkspace(): Plugin {
  return {
    name: 'copy-pro-workspace',
    apply: 'build',
    closeBundle() {
      const source = resolve(__dirname, 'pro');
      const destination = resolve(__dirname, 'dist', 'pro');
      if (!existsSync(source)) return;
      rmSync(destination, { force: true, recursive: true });
      cpSync(source, destination, { recursive: true });
    }
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    copyProWorkspace(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Printing & Booklet Specialist',
        short_name: 'Booklet Specialist',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,pdf}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/pro(?:\/|$)/,
          new RegExp(`^${escapeRegExp(basePath)}pro(?:/|$)`)
        ]
      }
    })
  ]
});
