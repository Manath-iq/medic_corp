import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { renderPage, sitemap, buildBase } from '../dist-server/entry-server.js'
const config = { siteUrl: 'https://clinic.example' + buildBase, indexable: true }
const original = await (await fetch('http://localhost:3001/api/site')).json()
const template = await fs.readFile('dist/index.html', 'utf8')
const results = await Promise.all(Array.from({ length: 20 }, async (_, i) => {
  const content = structuredClone(original)
  content.clinic.phone = `request-phone-${i}`
  content.homepage.title = `request-title-${i}`
  const result = renderPage(content, new URL(config.siteUrl), config, () => template)
  assert.ok(result.html.includes(`request-title-${i}`))
  assert.ok(result.html.includes(`request-phone-${i}`))
  assert.equal(result.noindex, false)
  assert.equal(result.status, 200)
  assert.equal((result.html.match(/<h1\b/g) || []).length, 1)
  assert.ok(!result.html.includes('name="robots" content="noindex'))
  return result.html
}))
for (let i = 0; i < results.length; i++) for (let j = 0; j < results.length; j++) if (i !== j) assert.ok(!results[i].includes(`request-phone-${j}\"`))
const urls = [...sitemap(original, config).matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&'))
for (const url of urls) {
  const page = renderPage(original, new URL(url), config, () => template)
  assert.equal(page.status, 200, url)
  assert.equal(page.noindex, false, url)
}
console.log(`20 isolated renders and ${urls.length} production sitemap URLs passed.`)
