import type { Content } from './content'

export type SeoConfig = { siteUrl: string; indexable: boolean }
export const sections = ['services', 'specialists', 'about', 'patients', 'oms', 'offers', 'contacts', 'news'] as const
const labels: Record<string, string> = { services: 'Услуги и цены', specialists: 'Специалисты клиники', about: 'О клинике', patients: 'Информация для пациентов', oms: 'ЭКО по ОМС', offers: 'Акции клиники', contacts: 'Контакты', news: 'Новости клиники' }
const descriptions: Record<string, string> = {
  home: 'Клиника семейной медицины в Казани: лечение бесплодия, ЭКО и приём специалистов. Услуги, цены, ЭКО по ОМС и контакты для записи.',
  services: 'Услуги и цены Клиники семейной медицины в Казани: консультации врачей, обследования и репродуктивные программы. Состав услуг, подготовка и запись по телефону.',
  specialists: 'Специалисты Клиники семейной медицины в Казани. Направления приёма, образование и квалификация врачей, услуги и стоимость консультаций. Контакты для записи.',
  contacts: 'Контакты Клиники семейной медицины в Казани: адрес, телефоны регистратуры, часы работы и маршрут. Уточните доступное время приёма и подготовку к визиту.',
  news: 'Новости Клиники семейной медицины в Казани: события, объявления и информация для пациентов. Подробности работы клиники и контакты для записи на приём.',
  offers: 'Акции Клиники семейной медицины в Казани: действующие предложения, сроки и условия участия. Подробности и возможность записи уточните в регистратуре.',
}
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
export const jsonForHtml = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
const compact = (value: string) => value.replace(/\s+/g, ' ').trim()
const excerpt = (value: string) => {
  const text = compact(value)
  if (text.length <= 165) return text
  return text.slice(0, 162).replace(/\s+\S*$/, '') + '…'
}
export const siteLink = (config: SeoConfig, path = '') => new URL(path, config.siteUrl.replace(/\/?$/, '/')).href

export function resolveSeo(content: Content, url: URL, config: SeoConfig) {
  const base = new URL(config.siteUrl).pathname.replace(/\/?$/, '/')
  const relative = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : '__missing__'
  const route = relative.replace(/\/$/, '') || 'home'
  const param = ({ services: 'service', specialists: 'doctor', offers: 'offer', news: 'post', pages: 'page' } as Record<string, string>)[route]
  const id = param ? url.searchParams.get(param) : null
  const service = route === 'services' && id !== null ? content.services.find(s => s.id === id) : undefined
  const doctor = route === 'specialists' && id !== null ? content.doctors.find(d => d.id === id) : undefined
  const post = (route === 'news' || route === 'offers') && id !== null ? (route === 'news' ? content.news : content.promotions).find(p => p.id === id) : undefined
  const page = content.pages.find(p => p.id === (route === 'pages' ? id : route))
  const known = route === 'home' || sections.includes(route as typeof sections[number]) || route === 'pages'
  const missing = !known || (id !== null && !(service || doctor || post || (route === 'pages' && page))) || (route === 'pages' && !page) || (['about', 'patients', 'oms'].includes(route) && !page)
  const filtered = ['q', 'category', 'direction'].some(key => url.searchParams.has(key)) && !id
  const preview = url.searchParams.has('preview')
  const empty = !id && ((route === 'offers' && !content.promotions.some(p => p.active)) || (route === 'news' && !content.news.length))
  const noindex = !config.indexable || missing || filtered || preview || empty
  const name = missing ? 'Страница не найдена' : service?.title || (doctor && `${doctor.name} ${doctor.given}`) || post?.title || page?.title || labels[route] || content.clinic.name
  const record = service || doctor || post || page
  const title = missing ? 'Страница не найдена | КСМ' : record?.seoTitle || (route === 'home' ? 'КСМ в Казани — лечение бесплодия, ЭКО и приём специалистов' : `${name} | КСМ, Казань`)
  const description = excerpt(missing ? 'Выберите нужный раздел на сайте Клиники семейной медицины.' : record?.seoDescription || service?.summary || (doctor && `${name} — ${doctor.role}. ${doctor.detail} Образование, квалификация, услуги и запись на приём в Клинику семейной медицины в Казани.`) || post?.excerpt || page?.lead || descriptions[route] || `${name}. Клиника семейной медицины в Казани: информация для пациентов и контакты для записи.`)
  const path = route === 'home' ? '' : `${route}/`
  const pageAlias = route === 'pages' && id && sections.includes(id as typeof sections[number])
  const canonical = siteLink(config, pageAlias ? `${id}/` : path + (id && !missing ? `?${param}=${encodeURIComponent(id)}` : ''))
  const imageValue = doctor?.image || post?.cover || page?.image || content.homepage.image || 'assets/clinic/diagnostics.webp'
  const image = new URL(imageValue, siteLink(config)).href
  const clinicId = siteLink(config, '#clinic'), websiteId = siteLink(config, '#website')
  const clinic: Record<string, unknown> = {
    '@type': 'MedicalClinic', '@id': clinicId, name: content.clinic.name,
    url: siteLink(config), telephone: content.clinic.phone, address: { '@type': 'PostalAddress', streetAddress: content.clinic.address },
    ...(content.clinic.legalName && { legalName: content.clinic.legalName }),
    ...(content.clinic.email && { email: content.clinic.email }),
    logo: siteLink(config, 'icons/ksm-v1-180.png'), image: new URL(content.homepage.image || 'assets/clinic/diagnostics.webp', siteLink(config)).href,
    ...(content.clinic.mapUrl && { hasMap: content.clinic.mapUrl }),
    ...(Number.isFinite(content.clinic.lat) && Number.isFinite(content.clinic.lng) && { geo: { '@type': 'GeoCoordinates', latitude: content.clinic.lat, longitude: content.clinic.lng } }),
  }
  const graph: Record<string, unknown>[] = [clinic,
    { '@type': 'WebSite', '@id': websiteId, url: siteLink(config), name: content.clinic.name, inLanguage: 'ru-RU', publisher: { '@id': clinicId } },
    { '@type': doctor ? 'ProfilePage' : ['services', 'specialists', 'news', 'offers'].includes(route) && !id ? 'CollectionPage' : 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, description, inLanguage: 'ru-RU', isPartOf: { '@id': websiteId }, ...(doctor && { mainEntity: { '@id': canonical + '#person' } }) },
  ]
  if (route !== 'home') {
    const crumbs = [{ name: 'Главная', item: siteLink(config) }]
    if (id && labels[route]) crumbs.push({ name: labels[route], item: siteLink(config, path) })
    crumbs.push({ name, item: canonical })
    graph.push({ '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumbs', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) })
  }
  if (doctor) graph.push({ '@type': 'Person', '@id': canonical + '#person', name, jobTitle: doctor.role, url: canonical, ...(doctor.image && { image }), worksFor: { '@id': clinicId } })
  if (service) graph.push({ '@type': 'Service', '@id': canonical + '#service', name, description: service.summary, url: canonical, provider: { '@id': clinicId } })
  // No invented author, review rating, medical claims or automatic freshness dates.
  if (post && route === 'news') graph.push({ '@type': 'Article', '@id': canonical + '#article', headline: post.title, description: post.excerpt, ...(post.cover && { image }), ...(post.publishedAt && { datePublished: post.publishedAt }), publisher: { '@id': clinicId }, mainEntityOfPage: { '@id': canonical + '#webpage' } })
  return { route, missing, noindex, title, description, canonical, image, graph: missing || preview ? [] : graph, doctor, service, post }
}

export function seoHead(seo: ReturnType<typeof resolveSeo>) {
  const meta = (name: string, value: string, property = false) => `<meta ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(value)}">`
  return [
    `<title>${escapeHtml(seo.title)}</title>`, meta('description', seo.description),
    meta('robots', seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
    ...(!seo.missing ? [`<link rel="canonical" href="${escapeHtml(seo.canonical)}">`] : []),
    meta('og:locale', 'ru_RU', true), meta('og:type', seo.post && seo.route === 'news' ? 'article' : 'website', true),
    meta('og:title', seo.title, true), meta('og:description', seo.description, true), meta('og:url', seo.canonical, true), meta('og:image', seo.image, true), meta('og:image:alt', seo.title, true),
    meta('twitter:card', 'summary_large_image'), meta('twitter:title', seo.title), meta('twitter:description', seo.description), meta('twitter:image', seo.image),
    ...(seo.graph.length ? [`<script type="application/ld+json">${jsonForHtml({ '@context': 'https://schema.org', '@graph': seo.graph })}</script>`] : []),
  ].join('\n')
}

export function sitemap(content: Content, config: SeoConfig) {
  if (!config.indexable) return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>'
  const paths = ['', ...sections.map(s => `${s}/`),
    ...content.services.map(s => `services/?service=${encodeURIComponent(s.id)}`),
    ...content.doctors.map(d => `specialists/?doctor=${encodeURIComponent(d.id)}`),
    ...content.news.map(p => `news/?post=${encodeURIComponent(p.id)}`),
    ...content.promotions.map(p => `offers/?offer=${encodeURIComponent(p.id)}`),
    ...content.pages.filter(p => !sections.includes(p.id as typeof sections[number])).map(p => `pages/?page=${encodeURIComponent(p.id)}`)]
  const urls = [...new Set(paths.map(path => siteLink(config, path)))].filter(url => !resolveSeo(content, new URL(url), config).noindex)
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeHtml(url)}</loc></url>`).join('')}</urlset>`
}

export function robots(config: SeoConfig) {
  return config.indexable ? `User-agent: *\nDisallow: /admin\nDisallow: /api/\nAllow: /api/media/file/\nAllow: /api/document/\n\nSitemap: ${siteLink(config, 'sitemap.xml')}\n` : 'User-agent: *\nDisallow: /\n'
}
