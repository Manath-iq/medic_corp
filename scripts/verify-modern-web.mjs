// QA_TOOLS_DIR=/path/to/npm-prefix node scripts/verify-modern-web.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'

const require = createRequire(import.meta.url)
const paths = [process.env.QA_TOOLS_DIR || process.cwd()]
const { chromium } = require(require.resolve('playwright-core', { paths }))
const axePath = require.resolve('axe-core/axe.min.js', { paths })
const url = process.env.QA_URL || 'http://localhost:4173/medic_corp/'
const output = process.env.QA_OUTPUT_DIR || resolve('test-results/modern-web')
await mkdir(output, { recursive: true })
// Exercise fallback selection in an isolated fixture, never renaming real assets.
const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' })
const preloadPlugin = loaded.config.plugins.find(plugin => plugin?.name === 'preload-hero-image')
const fixture = resolve(output, `preload-fixture-${Date.now()}`)
await mkdir(resolve(fixture, 'src/assets/generated'), { recursive: true })
const preloadForFixture = () => preloadPlugin.transformIndexHtml.handler('', { filename: resolve(fixture, 'index.html') })[0].attrs.href
assert.equal(preloadForFixture(), '/assets/clinic/embryology.webp')
await writeFile(resolve(fixture, 'src/assets/generated/hero-lab.png'), '')
assert.equal(preloadForFixture(), '/src/assets/generated/hero-lab.png')
await writeFile(resolve(fixture, 'src/assets/generated/hero-lab.webp'), '')
assert.equal(preloadForFixture(), '/src/assets/generated/hero-lab.webp')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const reports = []
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const externalRequests = []
    const imageRequests = []
    const errors = []
    let mapClicks = 0
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (request.resourceType() === 'image') imageRequests.push(request.url()) })
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue()
      externalRequests.push({ url: route.request().url(), mapClicks })
      // No real third-party traffic; test the frame boundary with a local response.
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="ru"><title>Тест карты</title><a href="#map">Карта</a></html>' })
    })
    const response = await page.goto(url, { waitUntil: 'networkidle' })
    const html = await response.text()
    assert.match(html, /rel="preload"[^>]*as="image"/)
    const preload = await page.locator('link[rel="preload"][as="image"]').getAttribute('href')
    const hero = await page.locator('.hero-image').evaluate(image => image.currentSrc)
    assert.equal(new URL(preload, url).href, hero, 'Preload must match the actual hero asset')
    assert.equal(imageRequests.filter(request => request === hero).length, 1, 'No duplicate hero fetch')
    assert.equal(await page.locator('.location-map-shell iframe').count(), 0)
    assert.deepEqual(externalRequests, [], 'No external requests before map activation')

    if (width < 951) {
      const toggle = page.locator('.menu-toggle')
      await toggle.click()
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('#mobile-nav').count(), 0)
      assert.equal(await toggle.evaluate(node => node === document.activeElement), true)
      await toggle.click()
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('#mobile-nav a').first().evaluate(node => node === document.activeElement), true)
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('#mobile-nav').count(), 0)
      assert.equal(await toggle.evaluate(node => node === document.activeElement), true)
      await toggle.click()
      await page.keyboard.press('Tab')
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.waitForFunction(() => !document.querySelector('#mobile-nav'))
      assert.equal(await page.locator('.desktop-nav a').first().evaluate(node => node === document.activeElement), true)
      await page.setViewportSize({ width, height: 900 })
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
      await toggle.click()
      await page.locator('#mobile-nav a[href="#prices"]').focus()
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('#mobile-nav').count(), 0)
      assert.equal(await page.locator('#prices').evaluate(node => node === document.activeElement), true)
      assert.equal(new URL(page.url()).hash, '#prices')
    }

    await page.locator('#location').scrollIntoViewIfNeeded()
    await page.locator('#location').screenshot({ path: resolve(output, `${width}-map-placeholder.png`), style: '.site-header { visibility: hidden }' })
    assert.deepEqual(externalRequests, [], 'Scrolling to the map must not load it')
    await page.addScriptTag({ path: axePath })
    const axe = await page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
      return result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))
    })
    assert.deepEqual(axe, [])
    const before = await page.locator('.location-map-shell').boundingBox()
    const enable = page.getByRole('button', { name: 'Показать карту Яндекса', exact: true })
    await enable.focus()
    mapClicks++
    const mapRequest = page.waitForRequest(request => request.url().startsWith('https://yandex.ru/map-widget/'))
    await page.keyboard.press('Enter')
    await mapRequest
    await page.locator('.location-map-shell iframe').waitFor()
    await page.waitForFunction(() => document.activeElement?.tagName === 'IFRAME')
    assert.ok(externalRequests.length > 0)
    assert.ok(externalRequests.every(request => request.mapClicks === 1))
    const after = await page.locator('.location-map-shell').boundingBox()
    assert.ok(Math.abs(before.height - after.height) < 1, 'Map activation must preserve shell height')
    assert.equal(await page.locator('.location-map-fallback').isVisible(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    reports.push({ width, heroPreloadMatches: true, heroRequests: 1, mapOptIn: true, mapHeightStable: true, menu: width < 951 ? 'passed' : 'not applicable', axeViolations: axe, pageErrors: errors })
    await page.close()
  }
  await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2))
  console.log(JSON.stringify({ status: 'passed', reports, output }, null, 2))
} finally { await browser.close() }
