import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/favicon.ico', 'fonts/**/*.woff2', 'icons/*.png'],
      manifest: {
        name: 'Enso',
        short_name: 'Enso',
        description: 'Aikidō study companion — offline, bilingual, and calm.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/icons/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/enso-kb\.vercel\.app\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'enso-pages',
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'enso-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  // Dev-only prebundling to speed up cold starts. Does not affect prod output.
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion'],
    esbuildOptions: {
      // Modern target for dev prebundle
      target: 'es2020',
      // Drop license/banner comments in dev prebundle to reduce size
      legalComments: 'none',
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('motion')) return 'motion';
            if (id.includes('react')) return 'react-vendors';
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@generated': path.resolve(__dirname, './src/generated'),
      '@content': path.resolve(__dirname, './content'),
    },
  },
});
