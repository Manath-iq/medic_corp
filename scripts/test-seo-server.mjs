import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

async function withServer(env, run) {
  const child = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: '4176', SITE_URL: 'https://clinic.example/', SEO_INDEXABLE: 'true', CMS_INTERNAL_URL: 'http://localhost:3001', ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    await new Promise((resolve, reject) => {
      child.stdout.on('data', data => { if (String(data).includes('SEO server ready:')) resolve() })
      child.once('error', reject)
      child.once('exit', code => reject(new Error(`Test server exited before ready: ${code}`)))
    })
    await run()
  } finally { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited }
}

await withServer({}, async () => {
  const root = 'http://localhost:4176'
  const home = await fetch(root)
  assert.equal(home.status, 200)
  assert.equal(home.headers.get('x-robots-tag'), null)
  const html = await home.text()
  assert.ok(html.includes('href="https://clinic.example/"'))
  assert.ok(html.includes('content="index, follow, max-image-preview:large"'))
  const robots = await (await fetch(root + '/robots.txt')).text()
  assert.ok(robots.includes('Sitemap: https://clinic.example/sitemap.xml'))
  assert.ok(!robots.includes('Disallow: /\n'))
  const xml = await (await fetch(root + '/sitemap.xml')).text()
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1].replaceAll('&amp;', '&')))
  for (const url of urls) {
    const page = await fetch(root + url.pathname + url.search)
    assert.equal(page.status, 200, url.href)
    assert.equal(page.headers.get('x-robots-tag'), null, url.href)
  }
  for (const route of ['/services/?q=test', '/specialists/?direction=test', '/services/?service=missing', '/about/?preview=1']) {
    assert.ok((await fetch(root + route)).headers.get('x-robots-tag')?.includes('noindex'), route)
  }
  assert.equal((await fetch(root + '/.env')).status, 404)
  assert.equal((await fetch(root + '/assets/license/extract-1.jpg')).status, 404)
  const post = await fetch(root, { method: 'POST' }); assert.equal(post.status, 405)
  assert.equal(post.headers.get('allow'), 'GET, HEAD')
  assert.equal(await (await fetch(root, { method: 'HEAD' })).text(), '')
  console.log(`Production HTTP contract: ${urls.length} sitemap URLs, indexing flags, HEAD, POST, private files passed.`)
})
await withServer({ CMS_INTERNAL_URL: 'http://127.0.0.1:1' }, async () => {
  const page = await fetch('http://localhost:4176/')
  assert.equal(page.status, 503)
  assert.equal(page.headers.get('retry-after'), '60')
  assert.ok(page.headers.get('x-robots-tag')?.includes('noindex'))
  console.log('CMS outage returns 503 + Retry-After + noindex, not empty 200.')
})
