export type RichNode = { type: string; text?: string; format?: number | string; tag?: string; url?: string; fields?: { url?: string; linkType?: string }; children?: RichNode[] }
export type RichContent = { root: RichNode } | null
export type PublicDocument = { id: string; title: string; url: string; version: string; description: string }
export type PublicPost = { id: string; title: string; excerpt: string; cover: string; coverAlt: string; body: RichContent; showOnHome: boolean; serviceIds: string[]; publishedAt?: string; startsAt?: string; endsAt?: string; benefit?: string; conditions?: string; active?: boolean; seoTitle?: string; seoDescription?: string }
export type PublicPage = { id: string; title: string; lead: string; image: string; seoTitle?: string; seoDescription?: string; sections: { id: string; title: string; body: RichContent; documents: PublicDocument[]; links: { label: string; href: string }[] }[] }
export type Content = {
  schemaVersion: number; preview: boolean;
  clinic: { name: string; phone: string; phoneHref: string; extraPhone: string; email: string; address: string; hours: string; holidayHours: string; legalName: string; inn: string; ogrn: string; license: string; warning: string; mapAddress: string; lat: number; lng: number; routeUrl: string; mapUrl: string; reviewsUrl: string; prodoctorovUrl: string; priceDocumentUrl: string; priceDocumentVersion: string; licenseDocuments: PublicDocument[]; notice: string };
  homepage: { title: string; mobileTitle: string; lead: string; mobileLead: string; context: string; image: string; imageAlt: string; imageGenerated: boolean; imageCaption: string; ctaLabel: string; trust: { title: string; text: string }[] };
  directions: { id: string; name: string; title: string; label: string; detail: string; description: string; image: string; note: string; tag: string; showOnHome: boolean }[];
  doctors: { id: string; name: string; given: string; role: string; detail: string; image: string; topics: string[]; education: string[]; accreditation: string[]; schedule: string; direction: string; directions: string[]; showDetail: boolean; showOnHome: boolean; available: boolean; seoTitle?: string; seoDescription?: string }[];
  services: import('./services-data').Service[];
  documents: PublicDocument[]; pages: PublicPage[]; news: PublicPost[]; promotions: PublicPost[];
  faq: { id: string; question: string; answer: string; href: string; label: string; placement: string[] }[];
  reviews: { author: string; quote: string; dateLabel: string; rating: number | null; excerpt: boolean; sourceUrl: string }[];
}
let content: Content | null = null
export const siteContent = () => content
export const cmsEnabled = Boolean(import.meta.env.VITE_CMS_URL)

export async function loadContent() {
  if (!cmsEnabled) return
  const preview = new URLSearchParams(location.search).get('preview') === '1'
  const response = await fetch(`${import.meta.env.VITE_CMS_URL}/api/site${preview ? '?preview=1' : ''}`, { credentials: preview ? 'include' : 'omit', signal: AbortSignal.timeout(20000), cache: 'no-store' })
  if (!response.ok) throw new Error(preview && response.status === 401 ? 'Для предпросмотра войдите в админку в этом браузере.' : 'Не удалось загрузить данные клиники. Проверьте, запущен ли сервер админки.')
  const data = await response.json()
  if (data.schemaVersion !== 1 || !Array.isArray(data.services) || !Array.isArray(data.doctors) || !data.clinic) throw new Error('Сервер вернул неподдерживаемый формат данных.')
  content = data
  if (preview) {
    const banner = document.createElement('div')
    banner.className = 'cms-preview-banner'
    banner.textContent = 'Предпросмотр · Черновики видны только вам. Для публикации вернитесь в админку.'
    document.body.prepend(banner)
    document.body.classList.add('cms-preview')
    window.addEventListener('message', event => {
      if (event.origin === new URL(import.meta.env.VITE_CMS_URL).origin && event.data?.type === 'payload-live-preview') location.reload()
    })
  }
}

export async function boot(render: () => Promise<unknown>) {
  try { await loadContent(); await render() }
  catch (error) {
    const root = document.getElementById('root')!
    root.replaceChildren()
    const main = document.createElement('main')
    main.className = 'cms-load-error'
    const heading = document.createElement('h1'); heading.textContent = 'Не удалось открыть страницу'
    const message = document.createElement('p'); message.textContent = error instanceof Error ? error.message : 'Попробуйте ещё раз.'
    const retry = document.createElement('button'); retry.textContent = 'Попробовать снова'; retry.onclick = () => location.reload()
    main.append(heading, message, retry); root.append(main)
  }
}

export function safeHref(value?: string) {
  if (!value) return undefined
  try { const url = new URL(value, location.origin); return ['http:', 'https:', 'tel:', 'mailto:'].includes(url.protocol) ? value : undefined } catch { return undefined }
}
