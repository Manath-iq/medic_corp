// Read-only comparison harness: no CMS writes, credentials or production changes.
import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'

const origin = process.env.VISUAL_URL || 'http://localhost:4173/medic_corp/'
const output = `test-results/seo-${process.env.VISUAL_LABEL || 'before'}`
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    for (const [name, route] of [['home', ''], ['services', 'services/'], ['service', 'services/?service=reproductologist-first'], ['specialists', 'specialists/'], ['about', 'about/'], ['contacts', 'contacts/']]) {
      await page.goto(origin + route)
      await page.locator('main h1').waitFor()
      if (process.env.VISUAL_LABEL === 'after') await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true')
      await page.evaluate(async () => {
        await document.fonts.ready
        // Load lazy media for a reproducible full-page comparison.
        document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager' })
        await Promise.all([...document.images].map(img => img.decode().catch(() => {})))
      })
      await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true, animations: 'disabled' })
      results.push({ name, width, ...(await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.textContent, overflow: document.documentElement.scrollWidth > innerWidth + 2 }))) })
    }
    results.push({ width, errors })
    await context.close()
  }
} finally { await browser.close() }
await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
