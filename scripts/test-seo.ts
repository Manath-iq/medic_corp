import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { resolveSeo, seoHead, sitemap, robots, jsonForHtml } from '../src/seo.ts'
import { readConfig } from '../server/config.mjs'
import type { Content } from '../src/content.ts'

const content: Content = await (await fetch(process.env.SEO_TEST_CMS || 'http://localhost:3001/api/site')).json()
const config = { siteUrl: 'https://clinic.example/', indexable: true }
const demo = { siteUrl: 'https://clinic.manath.site/', indexable: false }
let checks = 0
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`) }
const seo = (path: string, data = content) => resolveSeo(data, new URL(path, config.siteUrl), config)
check('Production config requires explicit real HTTPS origin', () => {
  assert.throws(() => readConfig({}))
  for (const origin of ['http://clinic.example', 'https://clinic.manath.site', 'https://localhost', 'https://demo.github.io']) assert.throws(() => readConfig({ SITE_URL: origin, SEO_INDEXABLE: 'true' }))
  assert.equal(readConfig({ SITE_URL: 'https://clinic.example', SEO_INDEXABLE: 'true' }).indexable, true)
  assert.equal(readConfig({ SITE_URL: 'https://clinic.example' }).indexable, false)
})
check('Demo stays noindex; no public URLs in its sitemap', () => {
  assert.equal(resolveSeo(content, new URL(demo.siteUrl), demo).noindex, true)
  assert.ok(robots(demo).includes('Disallow: /'))
  assert.ok(!sitemap(content, demo).includes('<loc>'))
})
check('Robots permits media, keeps private APIs out, references canonical sitemap', () => {
  assert.ok(robots(config).includes('Allow: /api/media/file/'))
  assert.ok(robots(config).includes('Disallow: /admin'))
  assert.ok(robots(config).includes('Sitemap: https://clinic.example/sitemap.xml'))
})
check('Tracking parameters never enter canonical', () => {
  assert.equal(seo('/?utm_source=test').canonical, 'https://clinic.example/')
  assert.equal(seo('/services/?service=reproductologist-first&category=test&q=test&utm_source=test').canonical, 'https://clinic.example/services/?service=reproductologist-first')
})
check('Filters and search are noindex; actual service pages remain indexable', () => {
  for (const url of ['/services/?q=test', '/services/?category=reproduction', '/specialists/?direction=reproduction']) assert.equal(seo(url).noindex, true)
  assert.equal(seo('/services/?service=reproductologist-first&category=reproduction').noindex, false)
})
check('Missing content and unknown routes are real missing states', () => {
  for (const url of ['/missing/', '/services/?service=missing', '/specialists/?doctor=', '/news/?post=missing', '/pages/']) {
    assert.equal(seo(url).missing, true, url)
    assert.equal(seo(url).noindex, true, url)
    assert.ok(!seoHead(seo(url)).includes('rel="canonical"'))
  }
})
check('CMS SEO overrides respected for doctor, service, page, news', () => {
  const data = structuredClone(content)
  data.doctors[0].seoTitle = 'SEO doctor'; data.doctors[0].seoDescription = 'SEO doctor description'
  data.services[0].seoTitle = 'SEO service'
  data.pages[0].seoTitle = 'SEO page'
  data.news.push({ id: 'seo-news', title: 'News', excerpt: 'Excerpt', seoTitle: 'SEO news', cover: '', coverAlt: '', body: null, showOnHome: false, serviceIds: [] })
  assert.equal(seo(`/specialists/?doctor=${data.doctors[0].id}`, data).title, 'SEO doctor')
  assert.equal(seo(`/specialists/?doctor=${data.doctors[0].id}`, data).description, 'SEO doctor description')
  assert.equal(seo(`/services/?service=${data.services[0].id}`, data).title, 'SEO service')
  assert.equal(seo(`/pages/?page=${data.pages[0].id}`, data).title, 'SEO page')
  assert.equal(seo('/news/?post=seo-news', data).title, 'SEO news')
})
check('Untrusted CMS text cannot break JSON or HTML', () => {
  const data = structuredClone(content)
  data.services[0].seoTitle = '</title><script>alert(1)</script>'
  const head = seoHead(seo(`/services/?service=${data.services[0].id}`, data))
  assert.ok(!head.includes('<script>alert'))
  assert.ok(jsonForHtml({ text: '</script><img onerror=x>' }).includes('\\u003c/script>'))
})
check('Stable clinic entity; no invented ratings or medical credentials', () => {
  const home = seo('/').graph[0]
  const doctor = seo(`/specialists/?doctor=${content.doctors[0].id}`).graph
  assert.deepEqual(home, doctor[0])
  assert.ok(doctor.some(n => n['@type'] === 'Person'))
  assert.ok(!JSON.stringify(doctor).includes('AggregateRating'))
})
check('Sitemap has unique published canonical pages and no filters/preview/redirects', () => {
  const xml = sitemap(content, config)
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&'))
  assert.ok(urls.length > 20)
  assert.equal(new Set(urls).size, urls.length)
  for (const url of urls) {
    const item = resolveSeo(content, new URL(url), config)
    assert.equal(item.noindex, false, url)
    assert.equal(item.canonical, url)
    assert.ok(!url.includes('/prices/') && !url.includes('preview='))
  }
})
check('Removing a published service removes it from sitemap immediately', () => {
  const data = structuredClone(content), removed = data.services.shift()!
  assert.ok(!sitemap(data, config).includes(`service=${removed.id}<`))
  assert.equal(seo(`/services/?service=${removed.id}`, data).missing, true)
})
check('Preview has no schema and stays noindex', () => {
  assert.equal(seo('/about/?preview=1').noindex, true)
  assert.deepEqual(seo('/about/?preview=1').graph, [])
})
await fs.mkdir('test-results', { recursive: true })
await fs.writeFile('test-results/seo-unit.json', JSON.stringify({ passed: checks }))
console.log(`${checks} SEO checks passed`)
