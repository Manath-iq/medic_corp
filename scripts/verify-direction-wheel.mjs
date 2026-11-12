// Regressions for scrolling/clicking repeatedly without moving the pointer.
// QA_BROWSER=both QA_TOOLS_DIR=/path/to/tools node scripts/verify-direction-wheel.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const engines = require(require.resolve('playwright-core', { paths: [process.env.QA_TOOLS_DIR || process.cwd()] }))
const names = process.env.QA_BROWSER === 'both' ? ['chromium', 'webkit'] : [process.env.QA_BROWSER || 'chromium']
const baseline = process.env.QA_BASELINE === '1'
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
      const selected = () => page.locator('.direction-card').evaluateAll(cards => cards.findIndex(card => card.classList.contains('is-current')))
      const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const stream = async delta => {
        const sequence = []
        for (let index = 0; index < 17; index++) {
          await page.mouse.wheel(delta, 0)
          // These intervals model sustained hardware input, not file/job polling.
          await page.waitForTimeout(80)
          sequence.push(await selected())
        }
        return sequence
      }
      // No mouse.move or locator.click during either stream, even while the cards transform.
      const forward = await stream(80)
      const forwardTransitions = forward.reduce((sum, value, index) => sum + Number(value !== (index ? forward[index - 1] : 0)), 0)
      if (!baseline) assert.ok(forwardTransitions >= 3 && forwardTransitions <= 5, `${name}/${reducedMotion}: sustained forward wheel stuck or too fast: ${forward}`)

      const beforeReverse = await selected()
      const reverse = await stream(-80)
      const reverseTransitions = reverse.reduce((sum, value, index) => sum + Number(value !== (index ? reverse[index - 1] : beforeReverse)), 0)
      if (!baseline) assert.ok(reverseTransitions >= 3 && reverseTransitions <= 5, `${name}/${reducedMotion}: sustained reverse wheel stuck or too fast: ${reverse}`)

      // An isolated gesture's immediate tail and tiny decaying deltas must not skip a card.
      await page.waitForTimeout(240)
      const beforeFlick = await selected()
      await page.mouse.wheel(150, 0)
      await settle()
      assert.equal(await selected(), (beforeFlick + 1) % 6)
      for (const delta of [30, 12, 6, 2, 1]) {
        await page.mouse.wheel(delta, 0)
        await page.waitForTimeout(80)
      }
      assert.equal(await selected(), (beforeFlick + 1) % 6, `${name}: immediate decaying tail skips cards`)

      // Consecutive new gestures also work at the same coordinates.
      await page.waitForTimeout(240)
      const beforeNewGesture = await selected()
      await page.mouse.wheel(80, 0)
      await settle()
      assert.equal(await selected(), (beforeNewGesture + 1) % 6)

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
      reports.push({ browser: name, reducedMotion, baseline, forwardTransitions, reverseTransitions, stationaryClicks: 4, errors })
      await page.close()
    }
  } finally { await browser.close() }
}
await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2))
console.log(JSON.stringify(reports, null, 2))
