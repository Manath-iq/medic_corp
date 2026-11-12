// Optional UI QA tooling lives outside the app's production dependencies.
// QA_TOOLS_DIR=/path/to/npm-prefix node scripts/verify-landing.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const paths = [process.env.QA_TOOLS_DIR || process.cwd()]
const engines = require(require.resolve('playwright-core', { paths }))
const engine = process.env.QA_BROWSER || 'chromium'
const axePath = require.resolve('axe-core/axe.min.js', { paths })
const output = process.env.QA_OUTPUT_DIR || resolve('test-results/landing')
await mkdir(output, { recursive: true })
const browser = await engines[engine].launch(engine === 'chromium' ? {
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
} : { headless: true })
const reports = []
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`) })
    await page.goto(process.env.QA_URL || 'http://localhost:4173/medic_corp/')
    await page.evaluate(() => document.fonts.ready)
    for (const selector of ['.hero', '#directions', '#doctors', '#prices', '#oms', '#start', '#about', '#faq', '#contact']) {
      await page.locator(selector).scrollIntoViewIfNeeded()
      for (const reveal of await page.locator(`${selector} [data-reveal]`).all()) {
        await reveal.scrollIntoViewIfNeeded()
        await page.waitForFunction(node => Number(getComputedStyle(node).opacity) > .99, await reveal.elementHandle())
      }
    }
    for (let index = 0; index < 6; index++) {
      if (width <= 700) await page.locator('.direction-picker select').selectOption(String(index))
      else await page.locator('.direction-index button').nth(index).click()
      await page.locator('.fan-stage').scrollIntoViewIfNeeded()
      await page.waitForFunction(() => {
        const image = document.querySelector('.is-current img')
        return image.complete && image.naturalWidth > 0
      })
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`)
    assert.equal(await page.locator('h1').count(), 1)
    assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash)), [])
    assert.deepEqual(await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src)), [])
    const contrast = await page.evaluate(() => {
      const luminance = rgb => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
      const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
      const background = element => {
        for (let node = element; node; node = node.parentElement) {
          const color = getComputedStyle(node).backgroundColor
          if (!color.startsWith('rgba(')) return color
        }
        throw new Error('No solid ancestor for palette sample')
      }
      return ['body', '.nav-actions .button-primary', '.hero-title-accent', '.hero-lead', '.hero-actions .button-primary', '.is-current .direction-select', '.price-panel-note', '.oms-copy .button-primary', '.contact-slab .button-primary', '.direction-picker select', '.price-expand'].filter(selector => {
        const nodes = [...document.querySelectorAll(selector)]
        return nodes.some(node => node.getClientRects().length) || selector === '.nav-actions .button-primary'
      }).map(selector => {
        const nodes = [...document.querySelectorAll(selector)]
        const element = nodes.find(node => node.getClientRects().length) || nodes[0]
        const foreground = getComputedStyle(element).color
        const bg = background(element)
        const values = [luminance(rgb(foreground)), luminance(rgb(bg))].sort((a, b) => b - a)
        return { selector, foreground, background: bg, ratio: (values[0] + .05) / (values[1] + .05) }
      })
    })
    assert.deepEqual(contrast.filter(pair => pair.ratio < 4.5), [], `Rendered palette contrast at ${width}`)

    await page.locator('#oms').scrollIntoViewIfNeeded()
    const local = page.getByRole('radio', { name: 'Татарстан', exact: true })
    const regional = page.getByRole('radio', { name: 'Другие регионы РФ', exact: true })
    // Set keyboard modality before programmatic focus; WebKit does not infer it from arrow input.
    await page.keyboard.press('Tab')
    await local.focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await regional.isChecked(), true)
    assert.equal(await page.locator('.oms-steps > li').count(), 3)
    assert.match(await page.locator('.oms-route-panel').innerText(), /паспорт, полис ОМС, СНИЛС/i)
    assert.match(await page.locator('.oms-note a').getAttribute('href'), /dlya-zhitelej-regionov-rf/)
    assert.equal(await regional.evaluate(input => getComputedStyle(input.nextElementSibling).outlineStyle), 'solid')
    await page.keyboard.press('ArrowLeft')
    assert.equal(await local.isChecked(), true)
    assert.equal(await page.locator('.oms-steps > li').count(), 4)

    const summaries = page.locator('.faq-item summary')
    await summaries.nth(0).focus()
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('.faq-item').nth(0).evaluate(node => node.open), true)
    await summaries.nth(1).focus()
    await page.keyboard.press('Space')
    assert.equal(await page.locator('.faq-item[open]').count(), 1)
    assert.equal(await page.locator('.faq-item').nth(1).evaluate(node => node.open), true)
    await page.keyboard.press('Space')
    assert.equal(await page.locator('.faq-item[open]').count(), 0)

    const markerCenters = await page.locator('.route-marker').evaluateAll(markers => markers.map(marker => {
      const rect = marker.getBoundingClientRect()
      return rect.top + scrollY + rect.height / 2
    }))
    const lineHeight = await page.locator('.route-line').evaluate(line => line.getBoundingClientRect().height)
    assert.ok(Math.abs(lineHeight - (markerCenters.at(-1) - markerCenters[0])) < 2)
    for (const [scrollY, expected] of [[markerCenters.at(-1) - 900 * .65 + 5, 1], [markerCenters[0] - 900 * .65 - 5, 0]]) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY)
      await page.waitForFunction(expected => {
        const matrix = new DOMMatrix(getComputedStyle(document.querySelector('.route-fill')).transform)
        return Math.abs(matrix.d - expected) < .01
      }, expected)
    }

    // Exercise the newly extended navigation without opening external destinations.
    if (width < 951) {
      const toggle = page.getByRole('button', { name: 'Открыть меню', exact: true })
      await toggle.click()
      await page.locator('#mobile-nav').getByRole('link', { name: 'ЭКО по ОМС' }).click()
      assert.equal(await page.locator('#mobile-nav').count(), 0)
      assert.equal(new URL(page.url()).hash, '#oms')
    } else {
      const links = await page.locator('.nav-bar').evaluate(bar => {
        const rect = bar.getBoundingClientRect()
        return [...bar.querySelectorAll('a')].filter(link => {
          const box = link.getBoundingClientRect()
          return box.width && (box.right > rect.right + 1 || box.left < rect.left - 1)
        }).map(link => link.textContent)
      })
      assert.deepEqual(links, [], `Header clipping at ${width}`)
    }

    await page.addScriptTag({ path: axePath })
    const axe = await page.evaluate(async () => {
      const result = await window.axe.run({ include: ['.hero', '#directions', '#doctors', '#prices', '#oms', '#start', '#about', '#faq'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
      return result.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }))
    })
    assert.deepEqual(axe, [], `Accessibility at ${width}: ${JSON.stringify(axe)}`)
    if (width === 390 || width === 1440) {
      for (const selector of ['.hero', '#directions', '#doctors', '#prices', '#oms', '#start', '#about', '#faq']) {
        // Hide only fixed chrome in isolated section captures; interaction tests use the real header.
        await page.locator(selector).screenshot({ path: resolve(output, `${width}-${selector.slice(1)}.png`), style: selector === '.hero' ? '.skip-link { visibility: hidden !important; }' : '.site-header,.skip-link { visibility: hidden !important; }' })
      }
    }
    assert.deepEqual(errors, [], `Console at ${width}`)
    reports.push({ width, overflow: false, regionalRadioKeyboard: true, faqKeyboardAndExclusive: true, routeForwardAndReverse: true, renderedPaletteContrast: contrast, axeViolations: axe, consoleErrors: errors })
    console.log(`Passed ${width}px`)
    await context.close()
  }
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(process.env.QA_URL || 'http://localhost:4173/medic_corp/')
    const state = await page.locator('.route-fill').evaluate(node => ({ transform: getComputedStyle(node).transform, height: node.getBoundingClientRect().height }))
    assert.equal(state.transform, 'none')
    assert.ok(state.height > 0)
    assert.equal(await page.locator('#oms [data-reveal]').first().evaluate(node => getComputedStyle(node).opacity), '1')
    reports.push({ width, reducedMotion: true, lineFullyVisible: true })
    await context.close()
  }
  await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2))
  console.log(JSON.stringify({ status: 'passed', output, reports }, null, 2))
} finally {
  await browser.close()
}
