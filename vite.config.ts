import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Les sous-ensembles de polices très légers seraient sinon encodés en data: URI dans le CSS,
  // ce que bloque la CSP (font-src 'self', sans data:). On les garde en fichiers séparés.
  build: { assetsInlineLimit: 0 },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Simulateur Présidentielle 2027',
        short_name: 'Présidentielle 27',
        description: 'Ce que les programmes des candidats changeraient pour toi. Simulation indicative, pas une consigne de vote.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f6fb',
        theme_color: '#6d28d9',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2,json}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
