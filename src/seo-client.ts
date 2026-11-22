import { siteContent } from './content'
import { resolveSeo, seoHead } from './seo'

export function applyClientSeo() {
  // Server HTML already has the exact same metadata, available before any JS.
  if (document.getElementById('site-content')) return
  const content = siteContent()
  if (!content) return
  const config = { siteUrl: new URL(import.meta.env.BASE_URL, location.origin).href, indexable: false }
  const seo = resolveSeo(content, new URL(location.href), config)
  document.head.querySelectorAll('title, meta[name="description"], meta[name="robots"], link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]').forEach(el => el.remove())
  const template = document.createElement('template')
  // seoHead escapes every text/attribute and uses script-safe JSON serialization.
  template.innerHTML = seoHead(seo)
  document.head.append(template.content)
}
