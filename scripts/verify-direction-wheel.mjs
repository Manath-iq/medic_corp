// Regressions for scrolling/clicking repeatedly without moving the pointer.
// QA_BROWSER=both QA_TOOLS_DIR=/path/to/tools node scripts/verify-direction-wheel.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const engines = require(require.resolve('playwright-core', { paths: [process.env.QA_TOOLS_DIR || process.cwd()] }))
const names = process.env.QA_BROWSER === 'both' ? ['chromium', 'webkit'] : [process.env.QA_BROWSER || 'chromium']
const output = process.env.QA_OUTPUT_DIR || resolve('test-results/stationary-wheel')
const reports = []
await mkdir(output, { recursive: true })

for (const name of names) {
  const browser = await engines[name].launch(name === 'chromium' ? { executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true } : { headless: true })
  try {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(process.env.QA_URL || 'http://localhost:4173/medic_corp/')
      const stage = page.locator('.fan-stage')
      await stage.scrollIntoViewIfNeeded()
      const rect = await stage.boundingBox()
      const position = { x: rect.x + rect.width / 2, y: rect.y + 200 }
      await page.mouse.move(position.x, position.y)
      const selected = () => page.locator('.direction-picker select').evaluate(select => select.selectedIndex)
      const checkGesture = async (deltas, expected) => {
        const before = await selected()
        for (const delta of deltas) {
          await page.mouse.wheel(delta, 0)
          await page.waitForTimeout(65)
          assert.equal(await selected(), before, 'Selection changed during the gesture')
        }
        await page.waitForTimeout(300)
        assert.equal(await selected(), expected)
      }
      await checkGesture([32, 24, 12, 6, 2], 0)
      await checkGesture([80, 54, 30, 16, 8, 4, 2, 1, 1], 1)
      await checkGesture([-100, -64, -25], 0)
      await checkGesture([200, 200, 110], 2)
      await checkGesture([500, 500, 500], 2)
      await checkGesture([-500, -500, -500], 2)

      // Repeated stationary clicks must work as well; no re-hover is needed.
      await page.waitForTimeout(560)
      const beforeClicks = await selected()
      for (let index = 1; index <= 4; index++) {
        await page.mouse.down()
        await page.mouse.up()
        await page.waitForTimeout(560)
        assert.equal(await selected(), (beforeClicks + index) % 6, `${name}: stationary click ${index}`)
      }
      assert.deepEqual(errors, [])
      reports.push({ browser: name, reducedMotion, stationaryClicks: 4, errors })
      await page.close()
    }
  } finally { await browser.close() }
}
await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2))
console.log(JSON.stringify(reports, null, 2))
