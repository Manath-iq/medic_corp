// QA_TOOLS_DIR=/path/to/npm-prefix QA_BROWSER=chromium|webkit|both node scripts/verify-direction-fan.mjs
// QA_BASELINE=1 records the old behavior without treating known missing interactions as failures.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const engines = require(require.resolve('playwright-core', { paths: [process.env.QA_TOOLS_DIR || process.cwd()] }))
const output = process.env.QA_OUTPUT_DIR || resolve('test-results/fan')
const baseline = process.env.QA_BASELINE === '1'
const names = process.env.QA_BROWSER === 'both' ? ['chromium', 'webkit'] : [process.env.QA_BROWSER || 'chromium']
const reports = []
await mkdir(output, { recursive: true })

for (const name of names) {
  const browser = await engines[name].launch(name === 'chromium' ? { executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true } : { headless: true })
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: width === 390, isMobile: width === 390 })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(process.env.QA_URL || 'http://localhost:4173/medic_corp/')
      await page.evaluate(() => document.fonts.ready)
      const stage = page.locator('.fan-stage')
      // Playwright cannot send native wheel input to mobile WebKit. Desktop uses real wheel input.
      const wheel = async (x, y) => width === 390 && name === 'webkit'
        ? stage.dispatchEvent('wheel', { deltaX: x, deltaY: y, bubbles: true, cancelable: true })
        : page.mouse.wheel(x, y)
      const selected = () => page.locator('.direction-picker select').evaluate(select => select.selectedIndex)
      const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const choose = async index => {
        if (await page.locator('.direction-picker').isVisible()) await page.locator('.direction-picker select').selectOption({ index })
        else await page.locator('.direction-index button').nth(index).click()
        await stage.scrollIntoViewIfNeeded()
      }
      const point = async index => page.locator(`.direction-card[data-direction-index="${index}"][aria-hidden="false"]`).evaluate(card => {
        const rect = card.getBoundingClientRect()
        // Actual hit testing: choose an exposed part, not an overlapping card's bounding box.
        for (let y = Math.max(100, rect.top + 90); y < Math.min(innerHeight - 20, rect.bottom - 40); y += 12) {
          for (let x = Math.max(12, rect.left + 12); x < Math.min(innerWidth - 12, rect.right - 12); x += 12) {
            const target = document.elementFromPoint(x, y)
            if (target?.closest('.direction-card') === card && !target.closest('.direction-select')) return { x, y }
          }
        }
        throw new Error('No exposed card area')
      })
      const metrics = await page.evaluate(() => ({
        heroHeight: document.querySelector('.hero').getBoundingClientRect().height,
        heroImageTop: document.querySelector('.hero-visual').getBoundingClientRect().top,
        documentHeight: document.documentElement.scrollHeight,
        visibleCopy: [...document.querySelectorAll('main p')].filter(node => node.getClientRects().length).map(node => node.innerText).join(' ').length,
      }))
      await page.locator('.hero').screenshot({ path: resolve(output, `${name}-${width}-hero.png`), style: '.skip-link { visibility:hidden !important }' })
      await choose(0)
      const transform = await page.locator('.is-current').evaluate(card => getComputedStyle(card).transform)
      await page.mouse.click(...Object.values(await point(1)))
      await settle()
      const afterSideClick = await selected()
      if (!baseline) assert.equal(afterSideClick, 1, `${name}: full-card click`)

      await choose(0)
      const center = await point(0)
      await page.mouse.move(center.x, center.y)
      await wheel(150, 0)
      await settle()
      const afterWheel = await selected()
      if (!baseline) assert.equal(afterWheel, 1, `${name}: horizontal trackpad wheel`)

      if (!baseline) {
        await wheel(150, 0)
        await settle()
        assert.equal(await selected(), 1, `${name}: inertial wheel tail must not skip cards`)
        await choose(2)
        const reverse = await point(2)
        await page.mouse.move(reverse.x, reverse.y)
        await wheel(-150, 0)
        await settle()
        assert.equal(await selected(), 1, `${name}: reverse wheel`)

        await choose(0)
        const active = await point(0)
        await page.mouse.click(active.x, active.y)
        assert.equal(await selected(), 1, `${name}: clicking center advances`)
        await page.getByRole('button', { name: 'Предыдущее направление', exact: true }).click()
        assert.equal(await selected(), 0)
        await page.getByRole('button', { name: 'Следующее направление', exact: true }).click()
        assert.equal(await selected(), 1)
        for (let index = 0; index < 6; index++) {
          await choose((index + 5) % 6)
          const exposed = await point(index)
          await page.mouse.click(exposed.x, exposed.y)
          assert.equal(await selected(), index, `${name}: full-card click ${index}`)
        }
        await stage.focus()
        await page.keyboard.press('End')
        assert.equal(await selected(), 5)
        await page.keyboard.press('ArrowRight')
        assert.equal(await selected(), 0)
        await page.keyboard.press('Home')
        await page.keyboard.press('ArrowLeft')
        assert.equal(await selected(), 5)

        for (const [index, dx, expected] of [[0, -110, 1], [1, 110, 0], [0, -20, 0]]) {
          await choose(index)
          const origin = await point(index)
          // Prefer a central point so both drag directions remain inside the viewport.
          const rect = await page.locator('.is-current').boundingBox()
          const x = Math.min(width - 125, Math.max(125, rect.x + rect.width / 2))
          await page.mouse.move(x, origin.y)
          await page.mouse.down()
          await page.mouse.move(x + dx, origin.y, { steps: 1 })
          await page.mouse.up()
          await settle()
          assert.equal(await selected(), expected, `${name}: drag ${dx}, no release click`)
          assert.equal(await stage.evaluate(node => node.classList.contains('is-dragging')), false)
        }

        // Cancellation and capture loss must snap back without selecting or leaving a stuck drag.
        for (const reason of ['pointercancel', 'lostpointercapture']) {
          await choose(0)
          const origin = await point(0)
          const x = width / 2
          await page.mouse.move(x, origin.y)
          await page.mouse.down()
          await page.mouse.move(x - 90, origin.y)
          // A second event commits pending pointer capture before testing capture loss.
          await page.mouse.move(x - 89, origin.y)
          await settle()
          assert.equal(await stage.evaluate(node => node.classList.contains('is-dragging')), true)
          if (reason === 'pointercancel') await stage.dispatchEvent(reason, { pointerId: 1, pointerType: 'mouse', isPrimary: true })
          else {
            await stage.evaluate(node => { for (let id = 1; id < 5; id++) if (node.hasPointerCapture(id)) node.releasePointerCapture(id) })
            await page.mouse.move(x - 91, origin.y)
          }
          await page.mouse.up()
          await settle()
          assert.equal(await selected(), 0, `${name}: ${reason} does not commit a swipe`)
          assert.equal(await stage.evaluate(node => node.classList.contains('is-dragging')), false)
        }

        await choose(0)
        assert.equal(await stage.evaluate(node => !node.dispatchEvent(new WheelEvent('wheel', { deltaX: 160, ctrlKey: true, bubbles: true, cancelable: true }))), false, 'Pinch zoom must not be blocked')
        assert.equal(await selected(), 0)

        await choose(0)
        const vertical = await point(0)
        await page.mouse.move(vertical.x, vertical.y)
        const beforeY = await page.evaluate(() => scrollY)
        if (width === 390 && name === 'webkit') {
          assert.equal(await stage.evaluate(node => !node.dispatchEvent(new WheelEvent('wheel', { deltaY: 180, bubbles: true, cancelable: true }))), false)
        } else {
          await wheel(0, 180)
          await page.waitForFunction(y => scrollY > y + 20, beforeY)
        }
        assert.equal(await selected(), 0, `${name}: ordinary page scroll does not select a card`)

        await choose(0)
        const button = page.locator('.is-current .direction-hitarea')
        await button.focus()
        await page.keyboard.press('Enter')
        assert.equal(await selected(), 1)
        if (width === 390) {
          await choose(0)
          const tap = await point(1)
          await page.touchscreen.tap(tap.x, tap.y)
          assert.equal(await selected(), 1, `${name}: real touch tap on a side card`)
          if (name === 'chromium') {
            // Native touch input, including implicit pointer capture and vertical browser scrolling.
            const cdp = await context.newCDPSession(page)
            await choose(0)
            const origin = await point(0)
            const x = width / 2
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: origin.y }] })
            for (const dx of [-20, -45, -75, -110]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx, y: origin.y }] })
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
            await settle()
            assert.equal(await selected(), 1, 'Native touch swipe advances exactly once')
            assert.equal(await stage.evaluate(node => node.classList.contains('is-dragging')), false)
            await choose(0)
            const verticalOrigin = await point(0)
            const before = await page.evaluate(() => scrollY)
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: verticalOrigin.y + 140 }] })
            for (const dy of [20, 50, 90, 140]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: verticalOrigin.y + 140 - dy }] })
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
            await page.waitForFunction(y => scrollY > y + 20, before)
            assert.equal(await selected(), 0, 'Native vertical touch scroll leaves the selection unchanged')
            await cdp.detach()
          }
          assert.ok(metrics.heroImageTop < 160, 'Mobile image should be visible near the top, not below a full text screen')
          assert.equal(await page.locator('.statement').isVisible(), false)
          assert.equal(await page.locator('.price-list > li:visible').count(), 3)
          await page.getByRole('button', { name: 'Показать все консультации', exact: true }).click()
          assert.equal(await page.locator('.price-list > li:visible').count(), 5)
          await page.getByRole('button', { name: 'Свернуть список', exact: true }).click()
          assert.equal(await page.locator('.price-list > li:visible').count(), 3)
        }
        for (const [index, count] of [[0, width === 390 ? 3 : 5], [1, 2], [2, 1], [3, 2]]) {
          await page.locator('.price-filters button').nth(index).click()
          assert.equal(await page.locator('.price-list > li:visible').count(), count, `${name}: price category ${index}`)
          if (index > 0) assert.equal(await page.locator('.price-expand').count(), 0)
        }
        await page.locator('.price-filters button').first().click()
        if (width === 390) {
          assert.equal(await page.locator('.price-expand').getAttribute('aria-expanded'), 'false')
          await page.setViewportSize({ width: 1440, height: 900 })
          assert.equal(await page.locator('.price-list > li:visible').count(), 5, 'Desktop never truncates the price list')
          assert.equal(await page.locator('.statement').isVisible(), true)
          await page.setViewportSize({ width, height: 900 })
        }
      }
      assert.notEqual(transform, 'none', `${name}: card transforms must resolve`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      assert.deepEqual(errors, [])
      reports.push({ browser: name, width, baseline, afterSideClick, afterWheel, transform, metrics, errors })
      await context.close()
      console.log(`${name} ${width}px: ${baseline ? 'baseline captured' : 'passed'}`)
    }
  } finally { await browser.close() }
}
await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2))
console.log(JSON.stringify(reports, null, 2))
