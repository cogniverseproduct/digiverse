import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Node global available when Vite loads this file (no @types/node in the client).
declare const process: { env: Record<string, string | undefined> };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Two pages: the DigiVerse app (index.html) and the standalone client-site entry (site.html).
    // site.html is the template for every per-client Vercel deployment (see server/scripts/build-site-bundle.mjs).
    rollupOptions: {
      input: {
        main: 'index.html',
        site: 'site.html'
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.DIGIVERSE_API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
