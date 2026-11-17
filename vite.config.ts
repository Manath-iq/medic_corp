import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { mediaExtensions, mediaSlots } from './src/media-slots.ts'

export default defineConfig({
  plugins: [react(), {
    name: 'preload-hero-image',
    transformIndexHtml: {
      // Run before Vite's asset processing so the URL gets the same build hash.
      order: 'pre',
      handler(_html, context) {
        if (context.filename !== resolve('index.html')) return
        const root = resolve(context.filename, '..')
        const [name, fallback] = mediaSlots.hero
        const extension = mediaExtensions.find(ext => existsSync(resolve(root, `src/assets/generated/${name}.${ext}`)))
        const href = extension ? `/src/assets/generated/${name}.${extension}` : `/assets/clinic/${fallback}`
        return [{ tag: 'link', attrs: { rel: 'preload', as: 'image', href, fetchpriority: 'high' }, injectTo: 'head' }]
      },
    },
  }],
  build: { rolldownOptions: { input: ['index.html', 'specialists/index.html'] } },
  base: '/medic_corp/',
  server: { port: 4173, strictPort: true },
  preview: { port: 4174, strictPort: true },
})
