import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium } from 'playwright-core'

const origin = process.env.DEMO_ORIGIN
if (!origin || !process.env.DEMO_CREDENTIALS_FILE) throw new Error('Set DEMO_ORIGIN and DEMO_CREDENTIALS_FILE (outside the project)')
process.loadEnvFile(process.env.DEMO_CREDENTIALS_FILE)
const output = 'test-results/vps'
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...(process.env.DEMO_PROXY ? { proxy: { server: process.env.DEMO_PROXY } } : {}) })
const page = await context.newPage()
const errors = []
const checks = []
page.on('pageerror', error => errors.push(error.message))
let originalPrice
async function restorePrice() {
  if (!originalPrice) return
  const result = await context.request.patch(`${origin}/api/prices/${originalPrice.id}`, {
    headers: { Origin: origin }, data: { amount: originalPrice.amount, _status: 'published' },
  })
  assert.ok(result.ok(), 'Restore original price')
  const snapshot = await (await context.request.get(`${origin}/api/site`)).json()
  assert.equal(snapshot.services.find(s => s.id === 'reproductologist-first').price.amount, originalPrice.amount)
  originalPrice = undefined
}
try {
  const publicData = await context.request.get(`${origin}/api/site`)
  assert.equal(publicData.status(), 200)
  assert.match(publicData.headers()['x-robots-tag'], /noindex/)
  const snapshot = await publicData.json()
  assert.ok(snapshot.services.length && snapshot.doctors.length)
  assert.equal((await context.request.get(`${origin}/api/site?preview=1`)).status(), 401)
  assert.ok([401, 403].includes((await context.request.get(`${origin}/api/users`)).status()))
  for (const doc of snapshot.documents) {
    const response = await context.request.get(doc.url)
    assert.equal(response.status(), 200, `Document ${doc.id}`)
    assert.ok((await response.body()).length > 100)
  }
  checks.push('Public API, anonymous access restrictions, documents and noindex')

  await page.goto(`${origin}/admin/login`)
  await page.getByRole('textbox', { name: 'Логин', exact: true }).fill('admin')
  await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill(process.env.DEMO_ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('heading', { name: 'Всё актуально. Всё под контролем.' }).waitFor()
  await page.screenshot({ path: `${output}/admin.png`, fullPage: true })
  checks.push('Administrator login through UI')

  const prices = await context.request.get(`${origin}/api/prices?where[key][equals]=reproductologist-first&depth=0`)
  originalPrice = (await prices.json()).docs[0]
  assert.ok(originalPrice)
  await page.goto(`${origin}/admin/collections/prices/${originalPrice.id}`)
  await page.locator('#field-amount').fill(String(originalPrice.amount + 10))
  await page.getByRole('button', { name: /Опубликовать изменения|Опубликовать/i }).first().click()
  await page.getByText(/успешно|опубликован|сохранен/i).first().waitFor({ timeout: 20000 })
  const changed = await (await context.request.get(`${origin}/api/site`)).json()
  assert.equal(changed.services.find(s => s.id === 'reproductologist-first').price.amount, originalPrice.amount + 10)
  await restorePrice()
  checks.push('Published price reaches public API; original price restored')

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['', 'specialists/', 'services/', 'prices/', 'news/', 'news/?post=donor-program', 'offers/', 'about/', 'patients/', 'oms/', 'contacts/']) {
      const response = await page.goto(`${origin}/${route}`)
      assert.equal(response.status(), 200, route)
      await page.locator('h1').waitFor()
      assert.equal(await page.locator('.cms-load-error').count(), 0, route)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `${route} ${width}`)
      const broken = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && !img.naturalWidth).map(img => img.src))
      assert.deepEqual(broken, [], route)
    }
    await page.goto(origin)
    await page.locator('h1').waitFor()
    await page.screenshot({ path: `${output}/home-${width}.png`, fullPage: true })
    checks.push(`11 public routes at ${width}px`)
  }
  await page.goto(`${origin}/services/?service=reproductologist-first&preview=1`)
  await page.locator('.cms-preview-banner').waitFor()
  assert.equal(await page.locator('.cms-load-error').count(), 0)
  checks.push('Authenticated preview')
  assert.deepEqual(errors, [])
} finally {
  try { await restorePrice() } finally {
    fs.writeFileSync(`${output}/report.json`, JSON.stringify({ checks, errors }, null, 2))
    await browser.close()
  }
}
console.log(JSON.stringify({ checks, errors }, null, 2))
