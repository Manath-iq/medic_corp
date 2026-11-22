import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { mediaExtensions, mediaSlots } from './src/media-slots.ts'

let siteBase = '/'

export default defineConfig({
  plugins: [react(), {
    // One icon set for every HTML entry, including direct profile/service URLs.
    name: 'shared-site-icons',
    configResolved(config) { siteBase = config.base },
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          { tag: 'link', attrs: { rel: 'icon', type: 'image/x-icon', sizes: '16x16 32x32 48x48', href: `${siteBase}icons/ksm-v1.ico` }, injectTo: 'head' },
          { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${siteBase}icons/ksm-v1-32.png` }, injectTo: 'head' },
          { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: `${siteBase}icons/ksm-v1-180.png` }, injectTo: 'head' },
        ]
      },
    },
  }, {
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
  build: { rolldownOptions: { input: ['index.html', 'specialists/index.html', 'services/index.html', 'about/index.html', 'patients/index.html', 'oms/index.html', 'prices/index.html', 'offers/index.html', 'contacts/index.html', 'news/index.html', 'pages/index.html'] } },
  base: '/medic_corp/',
  ssr: { noExternal: ['gsap'] },
  server: { port: 4173, strictPort: true },
  preview: { port: 4174, strictPort: true },
})
