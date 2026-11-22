import { AsyncLocalStorage } from 'node:async_hooks'
import { renderToString } from 'react-dom/server'
import { StrictMode } from 'react'
import { configureServerContext } from './content'
import type { Content, RenderContext } from './content'
import { resolveSeo, seoHead, jsonForHtml, escapeHtml } from './seo'
import type { SeoConfig } from './seo'
import App from './App'
import Services from './Services'
import Specialists from './Specialists'
import Information from './Information'

export { robots, sitemap } from './seo'
export const buildBase = import.meta.env.BASE_URL
const requests = new AsyncLocalStorage<RenderContext>()
configureServerContext(() => requests.getStore())

export function renderPage(content: Content, url: URL, config: SeoConfig, template: (route: string) => string) {
  const seo = resolveSeo(content, url, config)
  const preview = url.searchParams.has('preview')
  const previewRoute = ['home', 'services', 'specialists', 'about', 'patients', 'oms', 'offers', 'contacts', 'news', 'pages'].includes(seo.route)
  let html = template(seo.missing && !(preview && previewRoute) ? 'home' : seo.route)
  // Drafts are fetched only by the authenticated browser, not the public renderer.
  if (preview && previewRoute) return { status: 200, html, noindex: true }
  const body = requests.run({ content, url, route: seo.route }, () => {
    const page = seo.missing ? <main id="main" className="info-page container"><h1>Страница не найдена</h1><p>Возможно, ссылка изменилась или материал снят с публикации.</p><nav aria-label="Разделы клиники"><ul><li><a href={buildBase}>На главную</a></li><li><a href={`${buildBase}services/`}>Услуги и цены</a></li><li><a href={`${buildBase}specialists/`}>Специалисты</a></li><li><a href={`${buildBase}contacts/`}>Контакты</a></li></ul></nav></main>
      : seo.route === 'home' ? <App />
        : seo.route === 'services' ? <Services />
          : seo.route === 'specialists' ? <Specialists doctor={seo.doctor} /> : <Information />
    return renderToString(<StrictMode>{page}</StrictMode>)
  })
  html = html.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*name=["'](?:description|robots)["'][^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*rel=["']preload["'])(?=[^>]*as=["']image["'])[^>]*>/gi, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
    .replace('</head>', `${seoHead(seo)}\n${seo.route === 'home' && content.homepage.image ? `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(content.homepage.image)}">` : ''}</head>`)
    .replace(/<div id="root"[^>]*><\/div>/, () => `<div id="root" data-page="${escapeHtml(seo.route)}" data-ssr="true">${body}</div>`)
  if (seo.missing) {
    // Keep real 404 HTML; do not let a home-page JS entry replace it after load.
    html = html.replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi, '')
  } else html = html.replace('</body>', `<script type="application/json" id="site-content">${jsonForHtml(content)}</script></body>`)
  return { status: seo.missing ? 404 : 200, html, noindex: seo.noindex }
}
