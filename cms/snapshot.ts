import type { PayloadRequest } from 'payload'

// This is the sole public website contract. Internal users, source notes, version
// history and draft records are never spread into a public response.
type Doc = Record<string, any>
const list = (value: unknown): Doc[] => Array.isArray(value) ? value : []
const lines = (value: unknown) => list(value).map(row => String(row.text || ''))
const id = (value: any) => typeof value === 'object' && value ? value.id : value
const assetURL = (value: any): string => {
  const url = value?.url
  return typeof url === 'string' ? new URL(url, process.env.CMS_URL || 'http://localhost:3001').href : ''
}

export async function publicSnapshot(req: PayloadRequest) {
  const preview = req.query.preview === '1'
  if (preview && !req.user) return Response.json({ error: 'Для предпросмотра войдите в админку.' }, { status: 401 })
  const names = ['directions', 'specialists', 'services', 'prices', 'news', 'promotions', 'documents', 'pages', 'faq', 'reviews'] as const
  const results = await Promise.all(names.map(collection => req.payload.find({
    collection, pagination: false, depth: 2, draft: preview,
    where: preview ? {} : { _status: { equals: 'published' } },
    sort: collection === 'news' ? '-publishedAt' : 'order',
    overrideAccess: false, req,
  })))
  const records = Object.fromEntries(names.map((name, index) => [name, results[index].docs])) as unknown as Record<typeof names[number], Doc[]>
  const lookup = (name: typeof names[number], value: any) => records[name].find(record => record.id === id(value))
  const [rawClinic, rawHome] = await Promise.all(['clinic', 'homepage'].map(slug => req.payload.findGlobal({ slug, depth: 2, draft: preview, overrideAccess: true, req })))
  const c: Doc = preview || rawClinic._status === 'published' ? rawClinic : {}
  const h: Doc = preview || rawHome._status === 'published' ? rawHome : {}
  const directions = records.directions.map(d => ({ id: d.key, name: d.title, title: d.title, label: d.title, detail: d.description || '', description: d.description || '', image: assetURL(d.image), note: d.note || '', tag: d.tag || '', showOnHome: Boolean(d.showOnHome) }))
  const doctors = records.specialists.map(d => ({ id: d.key, name: d.name || 'Новый специалист', given: d.given || '', role: d.role || '', detail: d.detail || '', image: assetURL(d.photo), topics: lines(d.topics), education: lines(d.education), accreditation: lines(d.accreditation), schedule: d.schedule || '', direction: lookup('directions', list(d.directions)[0])?.key || '', directions: list(d.directions).map(x => lookup('directions', x)?.key).filter(Boolean), showDetail: Boolean(d.showDetail), showOnHome: Boolean(d.showOnHome), available: d.available !== false, seoTitle: d.seoTitle || '', seoDescription: d.seoDescription || '' }))
  const price = (p: Doc) => ({ id: p.key, title: p.title, amount: p.amount == null ? null : Number(p.amount), currency: 'RUB', kind: p.kind, note: p.note || '', variant: p.variant || '', sourceCode: p.sourceCode || '', specialistId: lookup('specialists', p.specialist)?.key || '' })
  const services = records.services.flatMap(s => {
    const direction = lookup('directions', s.direction)
    if (!direction) return []
    const prices = list(s.prices).map(p => lookup('prices', p)).filter((p): p is Doc => Boolean(p)).map(price)
    if (!preview && !prices.length) return []
    return [{ id: s.key, categoryId: direction.key, title: s.title, summary: s.summary || '', description: s.description || '', includes: lines(s.includes), preparation: s.preparation || '', doctorIds: list(s.doctors).map(d => lookup('specialists', d)?.key).filter(Boolean), price: prices[0] || { amount: null, currency: 'RUB', kind: 'onRequest', note: 'Стоимость уточните в регистратуре.' }, priceItems: prices, sourceCode: prices[0]?.sourceCode || '', sourceUrl: '', verifiedAt: s.updatedAt, contentStatus: 'published', showOnHome: Boolean(s.showOnHome), seoTitle: s.seoTitle || '', seoDescription: s.seoDescription || '' }]
  })
  const documentURL = (d: Doc) => preview ? assetURL(d) : `${process.env.CMS_URL || 'http://localhost:3001'}/api/document/${encodeURIComponent(d.key)}`
  const document = (d: Doc) => ({ id: d.key, title: d.title, url: documentURL(d), version: d.version || '', description: d.description || '', category: d.category })
  const documents = records.documents.map(document)
  const publicPost = (p: Doc) => ({ id: p.key, title: p.title, excerpt: p.excerpt || '', cover: assetURL(p.cover), coverAlt: p.cover?.alt || '', body: p.body || null, showOnHome: Boolean(p.showOnHome), serviceIds: list(p.services).map(s => lookup('services', s)?.key).filter(Boolean), seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '' })
  const now = Date.now()
  const promotions = records.promotions.filter(p => preview || Date.parse(p.startsAt) <= now).map(p => ({ ...publicPost(p), startsAt: p.startsAt, endsAt: p.endsAt, benefit: p.benefit || '', conditions: p.conditions || '', active: Date.parse(p.startsAt) <= now && now < Date.parse(p.endsAt) }))
  const pages = records.pages.map(p => ({ id: p.key, title: p.title, lead: p.lead || '', image: assetURL(p.image), seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '', sections: list(p.sections).map(s => ({ id: s.anchor, title: s.title, body: s.body || null, documents: list(s.documents).map(d => lookup('documents', d)).filter((d): d is Doc => Boolean(d)).map(document), links: list(s.links).map(l => ({ label: l.label, href: l.href })) })) }))
  const priceDocument = lookup('documents', c.priceDocument)
  return Response.json({
    schemaVersion: 1, preview, generatedAt: new Date().toISOString(),
    clinic: { name: c.name || '', phone: c.phone || '', phoneHref: `tel:${String(c.phone || '').replace(/[^+\d]/g, '')}`, extraPhone: c.extraPhone || '', email: c.email || '', address: c.address || '', hours: c.hours || '', holidayHours: c.holidayHours || '', legalName: c.legalName || '', inn: c.inn || '', ogrn: c.ogrn || '', license: c.license || '', warning: c.warning || '', mapAddress: c.mapAddress || '', lat: c.lat, lng: c.lng, routeUrl: c.routeUrl || '', mapUrl: c.mapUrl || '', reviewsUrl: c.reviewsUrl || '', prodoctorovUrl: c.prodoctorovUrl || '', priceDocumentUrl: priceDocument ? documentURL(priceDocument) : '', priceDocumentVersion: c.priceDocumentVersion || '', licenseDocuments: list(c.licenseDocuments).map(d => lookup('documents', d)).filter((d): d is Doc => Boolean(d)).map(document), notice: c.notice && (!c.noticeUntil || Date.parse(c.noticeUntil) > now) ? c.notice : '' },
    homepage: { title: h.title || '', mobileTitle: h.mobileTitle || '', lead: h.lead || '', mobileLead: h.mobileLead || '', context: h.context || '', image: assetURL(h.heroImage), imageAlt: h.heroImage?.alt || '', imageGenerated: Boolean(h.heroImage?.generated), imageCaption: h.imageCaption || '', ctaLabel: h.ctaLabel || '', trust: list(h.trust).map(t => ({ title: t.title, text: t.text })) },
    directions, doctors, services, documents, pages, promotions,
    news: records.news.map(p => ({ ...publicPost(p), publishedAt: p.publishedAt })),
    faq: records.faq.map(f => ({ id: String(f.id), question: f.title, answer: f.answer, href: f.href || '', label: f.linkLabel || '', placement: f.placement || [] })),
    reviews: records.reviews.map(r => ({ author: r.title, quote: r.quote, dateLabel: r.dateLabel || '', rating: r.rating, excerpt: Boolean(r.excerpt), sourceUrl: r.sourceUrl || '' })),
  }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Origin' } })
}
