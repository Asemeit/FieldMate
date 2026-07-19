import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Same-origin TTS proxy — avoids browser blocks on Google URLs. */
function fieldmateTtsPlugin(): Plugin {
  const handleTts = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/tts')) {
      next()
      return
    }

    try {
      const search = url.includes('?') ? url.slice(url.indexOf('?')) : ''
      const target = `https://translate.googleapis.com/translate_tts${search}`
      const upstream = await fetch(target, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!upstream.ok) {
        res.statusCode = upstream.status
        res.end(`TTS upstream error (${upstream.status})`)
        return
      }

      const audio = Buffer.from(await upstream.arrayBuffer())
      res.statusCode = 200
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Cache-Control', 'no-store')
      res.end(audio)
    } catch (err) {
      console.error('[FieldMate TTS proxy]', err)
      res.statusCode = 502
      res.end('TTS proxy error')
    }
  }

  return {
    name: 'fieldmate-tts-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleTts(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleTts(req, res, next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    open: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
  },
  plugins: [
    fieldmateTtsPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json,bin}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'FieldMate Crop Advisor',
        short_name: 'FieldMate',
        description: 'Crop disease detection and mobile agricultural advisor for smallholder farmers.',
        theme_color: '#1B4332',
        background_color: '#F4F9F4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
