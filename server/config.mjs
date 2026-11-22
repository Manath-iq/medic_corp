export function readConfig(env = process.env) {
  if (!env.SITE_URL) throw new Error('Set SITE_URL to the public site address (including base path, if any).')
  const url = new URL(env.SITE_URL)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be an HTTP(S) URL without credentials, query or fragment.')
  if (env.SEO_INDEXABLE && !['true', 'false'].includes(env.SEO_INDEXABLE)) throw new Error('SEO_INDEXABLE must be true or false.')
  const indexable = env.SEO_INDEXABLE === 'true'
  if (indexable && (url.protocol !== 'https:' || /(^localhost$|^127\.|^0\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|manath\.site$|github\.io$|\.test$|\.invalid$|\.local$|\[)/i.test(url.hostname))) {
    throw new Error('Indexing requires the real HTTPS clinic domain, not a demo/local address.')
  }
  url.pathname = url.pathname.replace(/\/?$/, '/')
  return { siteUrl: url.href, indexable }
}
