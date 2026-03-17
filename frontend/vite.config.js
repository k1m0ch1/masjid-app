import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const API_HOST = 'api-masjid.yggdrasil.id'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'offline.html',
      ],

      manifest: {
        id: '/',
        name: 'MasjidApp',
        short_name: 'MasjidApp',
        description: 'Sistem Administrasi Masjid — Jamaah, Keuangan & Kegiatan',
        start_url: '/',
        scope: '/',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        lang: 'id',
        categories: ['productivity', 'finance'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'Jamaah',
            short_name: 'Jamaah',
            url: '/jamaah',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Keuangan',
            short_name: 'Keuangan',
            url: '/finance',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Kegiatan',
            short_name: 'Kegiatan',
            url: '/events',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },

      workbox: {
        // Precache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest,json}'],
        globIgnores: ['**/node_modules/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB

        // Navigation fallback
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /^\/uploads/, /^\/\.well-known/],

        // Clean up old caches on SW update
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // ── Supabase auth: always network (never serve stale tokens) ───────
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-auth-v1',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Supabase storage/rest: NetworkFirst ────────────────────────────
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-v1',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Jamaah data: StaleWhileRevalidate, 7 hari ─────────────────────
          {
            urlPattern: ({ url, request }) =>
              url.hostname === API_HOST &&
              request.method === 'GET' &&
              url.pathname.startsWith('/api/v1/jamaah'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-jamaah-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Keuangan/transaksi: StaleWhileRevalidate, 1 hari ─────────────
          {
            urlPattern: ({ url, request }) =>
              url.hostname === API_HOST &&
              request.method === 'GET' &&
              (url.pathname.startsWith('/api/v1/transactions') ||
               url.pathname.startsWith('/api/v1/finance') ||
               url.pathname.startsWith('/api/v1/ziswaf') ||
               url.pathname.startsWith('/api/v1/zakat-fitrah')),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-finance-v1',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Events: StaleWhileRevalidate, 3 hari ─────────────────────────
          {
            urlPattern: ({ url, request }) =>
              url.hostname === API_HOST &&
              request.method === 'GET' &&
              url.pathname.startsWith('/api/v1/events'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-events-v1',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 3 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── API GET lainnya (setting, auth/me, dsb): StaleWhileRevalidate ─
          {
            urlPattern: ({ url, request }) =>
              url.hostname === API_HOST && request.method === 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-general-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Upload/receipt files dari backend: CacheFirst, 30 hari ────────
          {
            urlPattern: ({ url }) =>
              url.hostname === API_HOST && url.pathname.startsWith('/uploads'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-v1',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── R2 / CDN images: CacheFirst, 30 hari ──────────────────────────
          {
            urlPattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Google Fonts: CacheFirst, 1 tahun ─────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-v1',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        // Code splitting untuk lazy load per halaman
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor'
        },
      },
    },
  },
})
