import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  optimizeDeps: {
    exclude: ['@paddleocr/paddleocr-js', 'onnxruntime-web'],
  },
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'shiba.png'],
      manifest: {
        name: 'Remember Me',
        short_name: 'Remember Me',
        description: '全家一起用的物品小本子：买了什么、放在哪、还有多久过期',
        theme_color: '#f3efe6',
        background_color: '#f3efe6',
        display: 'standalone',
        lang: 'zh-CN',
        start_url: '/',
        icons: [
          {
            src: 'shiba.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'shiba.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 歌曲与 OCR（OpenCV / ORT / worker）体积大，不预缓存，首次用时再下
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globIgnores: [
          '**/assets/ort-wasm-*',
          '**/assets/worker-entry-*',
          '**/assets/ort.bundle*',
          '**/assets/dist-*', // OpenCV.js 懒加载包
        ],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/song.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'remember-me-audio',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            // PaddleOCR 模型（百度云）+ ONNX Runtime WASM
            urlPattern: ({ url }) =>
              url.hostname.includes('bcebos.com') ||
              (url.hostname.includes('jsdelivr.net') && url.pathname.includes('onnxruntime-web')),
            handler: 'CacheFirst',
            options: {
              cacheName: 'remember-me-ocr-assets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
            },
          },
        ],
      },
    }),
  ],
})
