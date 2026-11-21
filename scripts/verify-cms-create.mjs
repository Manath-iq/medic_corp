import assert from 'node:assert/strict'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright-core'
process.loadEnvFile('cms/.env.local')
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const base = 'http://localhost:3001'
const title = `Проверка редактора ${Date.now()}`
let createdID
try {
  await page.goto(`${base}/admin/login`)
  await page.getByRole('textbox', { name: 'Логин', exact: true }).fill(process.env.SEED_ADMIN_USERNAME || 'admin')
  await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill(process.env.SEED_ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('heading', { name: 'Всё актуально. Всё под контролем.' }).waitFor()
  await page.goto(`${base}/admin/collections/news/create`)
  await page.locator('#field-title').fill(title)
  await page.locator('#field-excerpt').fill('Тестовая запись для проверки формы. Будет удалена после проверки.')
  await page.getByRole('button', { name: /Опубликовать/i }).first().click()
  await page.waitForURL(/\/admin\/collections\/news\/\d+/, { timeout: 15000 })
  createdID = Number(page.url().split('/').at(-1))
  const snapshot = await (await context.request.get(`${base}/api/site`)).json()
  const post = snapshot.news.find(post => post.title === title)
  assert.ok(post, 'Созданная новость опубликована')
  await page.goto(`http://localhost:4173/medic_corp/news/?post=${post.id}`)
  await page.getByRole('heading', { name: title }).waitFor()
  console.log('Создание и публикация новости через форму без ручного ввода URL — пройдено.')
} catch (error) {
  await page.screenshot({ path: 'test-results/cms/create-error.png', fullPage: true })
  console.error(await page.locator('body').innerText())
  throw error
} finally {
  fs.writeFileSync('test-results/cms/test-created-news.json', JSON.stringify({ title, id: createdID }))
  await browser.close()
  const cleanup = spawnSync('node', ['--env-file=cms/.env.local', '--import', 'tsx', 'scripts/cleanup-cms-ui-test.ts'], { stdio: 'inherit' })
  assert.equal(cleanup.status, 0, 'Удаление временной тестовой новости')
}
