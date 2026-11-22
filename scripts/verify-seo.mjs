import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright-core'

const origin = process.env.SEO_TEST_URL || 'http://localhost:4175/'
const content = await (await fetch(process.env.SEO_TEST_CMS || 'http://localhost:3001/api/site')).json()
const routes = ['', 'services/', 'specialists/', 'about/', 'patients/', 'oms/', 'contacts/', 'offers/', 'news/',
  ...content.services.map(s => `services/?service=${encodeURIComponent(s.id)}`),
  ...content.doctors.map(d => `specialists/?doctor=${encodeURIComponent(d.id)}`),
  ...content.news.map(n => `news/?post=${encodeURIComponent(n.id)}`),
  ...content.promotions.map(n => `offers/?offer=${encodeURIComponent(n.id)}`),
  ...content.pages.map(p => `pages/?page=${encodeURIComponent(p.id)}`)]
const browser = await chromium.launch({ headless: true })
const report = []
try {
  const noJs = await browser.newContext({ javaScriptEnabled: false })
  const page = await noJs.newPage()
  for (const route of routes) {
    const response = await page.goto(origin + route)
    assert.equal(response.status(), 200, route)
    assert.equal(await page.locator('h1').count(), 1, route)
    assert.ok((await page.locator('main').innerText()).length > 50, route)
    assert.equal(await page.locator('link[rel="canonical"]').count(), 1, route)
    assert.equal(await page.locator('meta[name="description"]').count(), 1, route)
    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())
    assert.equal(graph['@context'], 'https://schema.org')
    const words = (await page.locator('main').innerText()).match(/[\p{L}\p{N}]+/gu)?.length || 0
    report.push({ route, noJavaScript: true, status: 200, title: await page.title(), words })
  }
  for (const route of ['missing/', 'services/?service=not-found', 'specialists/?doctor=not-found', 'news/?post=not-found', 'pages/?page=not-found']) {
    assert.equal((await page.goto(origin + route)).status(), 404, route)
    assert.equal(await page.locator('h1').innerText(), 'Страница не найдена')
    assert.equal(await page.locator('link[rel="canonical"]').count(), 0)
  }
  for (const route of ['prices/', 'services', 'services/index.html', 'index.html']) {
    const response = await fetch(origin + route, { redirect: 'manual' })
    assert.equal(response.status, 301, route)
  }
  const preview = await (await fetch(origin + 'specialists/?doctor=draft-only&preview=1')).text()
  assert.ok(preview.includes('<title>Специалисты клиники | КСМ, Казань</title>'))
  assert.ok(!preview.includes('id="site-content"'))
  await noJs.close()

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const client = await context.newPage()
  const errors = []
  client.on('pageerror', e => errors.push(e.message))
  client.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  for (const route of routes) {
    await client.goto(origin + route)
    await client.waitForFunction(() => document.documentElement.dataset.clientReady === 'true')
    assert.equal(await client.locator('h1').count(), 1)
  }
  await client.goto(origin + 'services/')
  await client.waitForFunction(() => document.documentElement.dataset.clientReady === 'true')
  await client.getByRole('searchbox').fill('репродуктолог')
  assert.ok((await client.locator('.svc-row').count()) > 0)
  await client.getByRole('searchbox').fill('несуществующаяуслуга')
  await client.getByRole('heading', { name: 'Не нашли такую услугу' }).waitFor()
  await client.getByRole('button', { name: 'Сбросить фильтры' }).click()
  assert.equal(await client.locator('.svc-row').count(), content.services.length)
  await client.goto(origin)
  await client.waitForFunction(() => document.documentElement.dataset.clientReady === 'true')
  const first = await client.locator('.direction-detail h3').innerText()
  await client.getByRole('button', { name: 'Следующее направление', exact: true }).click()
  assert.notEqual(await client.locator('.direction-detail h3').innerText(), first)
  assert.deepEqual(errors, [], 'Hydration / browser errors')
  await context.close()
  await fs.writeFile('test-results/seo-browser.json', JSON.stringify({ routes: report, missing: 5, redirects: 4, browserErrors: errors, interactions: 'passed' }, null, 2))
  console.log(`${routes.length} pages render without JavaScript and hydrate without errors; 5 missing URLs, 4 redirects, search and carousel passed.`)
} finally { await browser.close() }
