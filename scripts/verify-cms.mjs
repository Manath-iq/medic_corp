import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

process.loadEnvFile('cms/.env.local')
const require = createRequire(import.meta.url)
const output = 'test-results/cms'
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const cms = 'http://localhost:3001'
const site = 'http://localhost:4173/medic_corp/'
const reports = []
let originalPrice
let authHeaders
async function restorePrice() {
  if (!originalPrice) return
  const response = await context.request.patch(`${cms}/api/prices/${originalPrice.id}`, { headers: authHeaders, data: { amount: originalPrice.amount, _status: 'published' } })
  assert.equal(response.ok(), true, `Восстановление контрольной цены: ${await response.text()}`)
  const snapshot = await (await context.request.get(`${cms}/api/site`)).json()
  assert.equal(snapshot.services.find(s => s.id === 'reproductologist-first').price.amount, originalPrice.amount)
  originalPrice = undefined
}
try {
  await page.goto(`${cms}/admin/login`)
  await page.getByRole('textbox', { name: 'Логин', exact: true }).fill(process.env.SEED_ADMIN_USERNAME || 'admin')
  await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill(process.env.SEED_ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('heading', { name: 'Всё актуально. Всё под контролем.' }).waitFor()
  const session = await context.request.post(`${cms}/api/users/login`, { data: { username: process.env.SEED_ADMIN_USERNAME || 'admin', password: process.env.SEED_ADMIN_PASSWORD } })
  assert.equal(session.ok(), true)
  authHeaders = { Authorization: `JWT ${(await session.json()).token}` }
  await page.screenshot({ path: `${output}/dashboard-desktop.png`, fullPage: true })
  reports.push({ check: 'Вход через форму и главная админки', passed: true })

  for (const [path, text] of [['specialists', 'Специалисты'], ['prices', 'Цены'], ['news', 'Новости'], ['promotions', 'Акции'], ['pages', 'Страницы и памятки'], ['documents', 'Документы']]) {
    await page.goto(`${cms}/admin/collections/${path}`)
    await page.getByRole('heading', { name: text, exact: true }).waitFor()
    await page.screenshot({ path: `${output}/${path}-desktop.png`, fullPage: true })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)
    assert.equal(overflow, false, `${path}: page overflow`)
    reports.push({ check: `Открывается раздел ${text}`, passed: true })
  }

  const priceResult = await context.request.get(`${cms}/api/prices?where[key][equals]=reproductologist-first&depth=0`)
  originalPrice = (await priceResult.json()).docs[0]
  assert.ok(originalPrice)
  await page.goto(`${cms}/admin/collections/prices/${originalPrice.id}`)
  const amount = page.locator('#field-amount')
  await amount.waitFor()
  await page.screenshot({ path: `${output}/price-editor-desktop.png`, fullPage: true })
  const changed = originalPrice.amount + 10
  await amount.fill(String(changed))
  await page.getByRole('button', { name: /Опубликовать изменения|Опубликовать/i }).first().click()
  await page.getByText(/успешно|опубликован|сохранен/i).first().waitFor({ timeout: 20000 })
  const publicData = await (await context.request.get(`${cms}/api/site`)).json()
  assert.equal(publicData.services.find(s => s.id === 'reproductologist-first').price.amount, changed)
  for (const route of ['', 'services/?service=reproductologist-first', 'specialists/?doctor=solovev']) {
    await page.goto(site + route)
    const expected = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(changed)
    await page.getByText(expected, { exact: true }).first().waitFor()
  }
  reports.push({ check: 'Цена опубликована из интерфейса и обновилась на главной, в услуге и профиле врача', passed: true })
  await restorePrice()

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['', 'specialists/', 'services/', 'news/', 'news/?post=donor-program', 'offers/', 'about/', 'patients/', 'oms/', 'contacts/']) {
      await page.goto(site + route)
      await page.locator('h1').waitFor()
      assert.equal(await page.locator('h1').count(), 1, `h1: ${route}`)
      assert.equal(await page.locator('.cms-load-error').count(), 0, `content: ${route}`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `overflow: ${route} ${width}`)
      const images = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src))
      assert.deepEqual(images, [], `images: ${route}`)
      reports.push({ check: `${route || 'Главная'} · ${width}px`, passed: true })
    }
    await page.goto(`${cms}/admin`)
    await page.getByRole('heading', { name: 'Всё актуально. Всё под контролем.' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false)
    await page.screenshot({ path: `${output}/dashboard-${width}.png`, fullPage: true })
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
    const axe = await page.evaluate(async () => window.axe.run({ exclude: ['nextjs-portal'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
    reports.push({ check: `Доступность админки ${width}px`, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })) })
  }
  await page.goto(`${site}services/?service=reproductologist-first&preview=1`)
  await page.locator('.cms-preview-banner').waitFor()
  assert.equal(await page.locator('.cms-load-error').count(), 0)
  reports.push({ check: 'Предпросмотр с cookie авторизации', passed: true })
  const anonymous = await browser.newContext()
  const anonPage = await anonymous.newPage()
  await anonPage.goto(`${site}services/?service=reproductologist-first&preview=1`)
  await anonPage.locator('.cms-load-error').waitFor()
  reports.push({ check: 'Предпросмотр закрыт в другом браузерном сеансе', passed: true })
  await anonymous.close()
  assert.deepEqual(errors, [], 'Ошибки браузера')
} finally {
  await restorePrice()
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ reports, errors }, null, 2))
  await browser.close()
}
console.log(JSON.stringify(reports, null, 2))
