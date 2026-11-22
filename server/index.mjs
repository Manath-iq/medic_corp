import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readConfig } from './config.mjs'
import { buildBase, renderPage, robots, sitemap } from '../dist-server/entry-server.js'

const config = readConfig()
const base = new URL(config.siteUrl).pathname
if (base !== buildBase) throw new Error(`Build base ${buildBase} does not match SITE_URL path ${base}`)
const cms = new URL(process.env.CMS_INTERNAL_URL || 'http://127.0.0.1:3001')
const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const templates = new Map(await Promise.all(['home', 'services', 'specialists', 'about', 'patients', 'oms', 'offers', 'contacts', 'news', 'pages'].map(async route => [route, await fs.readFile(path.join(dist, route === 'home' ? 'index.html' : `${route}/index.html`), 'utf8')])))

async function snapshot() {
  // Only the anonymous published-content contract. Never forward session cookies.
  const response = await fetch(new URL('/api/site', cms), { signal: AbortSignal.timeout(15000), cache: 'no-store' })
  if (!response.ok) throw new Error(`CMS response ${response.status}`)
  const content = await response.json()
  if (content.schemaVersion !== 1 || content.preview || !content.clinic || !Array.isArray(content.services) || !Array.isArray(content.pages)) throw new Error('Invalid public CMS snapshot')
  return content
}

const server = http.createServer(async (req, res) => {
  const send = (status, body, type = 'text/html; charset=utf-8', noindex = !config.indexable) => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...(noindex && { 'X-Robots-Tag': 'noindex, follow' }) })
    res.end(req.method === 'HEAD' ? undefined : body)
  }
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return send(405, 'Method not allowed', 'text/plain', true) }
    // Ignore Host / forwarded headers: canonical origin comes only from deployment config.
    const url = new URL(req.url, config.siteUrl)
    if (url.pathname === '/healthz') return send(200, 'ok', 'text/plain', true)
    if (base === '/' && url.pathname.startsWith('/medic_corp/')) { res.writeHead(301, { Location: url.pathname.slice('/medic_corp'.length) + url.search }); return res.end() }
    if (url.pathname === '/robots.txt') return send(200, robots(config), 'text/plain; charset=utf-8')
    if (base !== '/' && url.pathname === base.slice(0, -1)) { res.writeHead(301, { Location: base + url.search }); return res.end() }
    if (!url.pathname.startsWith(base)) return send(404, 'Not found', 'text/plain', true)
    const route = url.pathname.slice(base.length)
    if (route === 'robots.txt') return send(200, robots(config), 'text/plain; charset=utf-8')
    if (route === 'sitemap.xml') return send(200, sitemap(await snapshot(), config), 'application/xml; charset=utf-8')
    if (route === 'pages/' && ['about', 'patients', 'oms', 'contacts', 'offers', 'news'].includes(url.searchParams.get('page')) && !url.searchParams.has('preview')) {
      res.writeHead(301, { Location: `${base}${url.searchParams.get('page')}/` }); return res.end()
    }
    if (route === 'prices/' || route === 'prices' || route === 'prices/index.html') { res.writeHead(301, { Location: `${base}services/` }); return res.end() }
    if (route === 'index.html' || route.endsWith('/index.html') || (route && !route.includes('.') && !route.endsWith('/'))) {
      const next = url.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/') + url.search
      res.writeHead(301, { Location: next }); return res.end()
    }
    // Optional asset serving for a standalone Node deployment/local verification.
    // Production Caddy serves the same public build directly.
    if (route.startsWith('assets/license/')) return send(404, 'Not found', 'text/plain', true)
    if (/^(assets|icons)\//.test(route)) {
      const file = path.resolve(dist, decodeURIComponent(route))
      if (!file.startsWith(dist + path.sep)) return send(404, 'Not found', 'text/plain', true)
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
      try { return send(200, await fs.readFile(file), types[path.extname(file)] || 'application/octet-stream') } catch { return send(404, 'Not found', 'text/plain', true) }
    }
    const result = renderPage(await snapshot(), url, config, route => templates.get(route))
    send(result.status, result.html, undefined, result.noindex)
  } catch (error) {
    console.error('Public render failed:', error instanceof Error ? error.message : 'Unknown error')
    res.setHeader('Retry-After', '60')
    send(503, '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Сайт временно недоступен</title><main><h1>Сайт временно недоступен</h1><p>Попробуйте открыть страницу немного позже.</p></main></html>', undefined, true)
  }
})
server.listen(Number(process.env.PORT || 4175), process.env.HOST || '127.0.0.1', () => console.log(`SEO server ready: ${config.siteUrl} (indexable: ${config.indexable})`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
