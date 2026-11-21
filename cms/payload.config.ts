import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor, ParagraphFeature, HeadingFeature, BoldFeature, ItalicFeature, UnderlineFeature, OrderedListFeature, UnorderedListFeature, LinkFeature, BlockquoteFeature, FixedToolbarFeature, InlineToolbarFeature } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import sharp from 'sharp'
import { collections, globals } from './schema'
import { publicSnapshot } from './snapshot'
import { documentFile, currentDocument } from './document-files'

const dirname = path.dirname(fileURLToPath(import.meta.url))
fs.mkdirSync(path.resolve(dirname, 'data'), { recursive: true })
if (!process.env.PAYLOAD_SECRET) throw new Error('Нет PAYLOAD_SECRET. Запустите npm run local — он создаст локальную конфигурацию.')

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.CMS_URL || 'http://localhost:3001',
  cors: ['http://localhost:4173', 'http://127.0.0.1:4173', 'http://localhost:4174', ...(process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] : [])],
  csrf: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:4173', 'http://127.0.0.1:4173', 'http://localhost:4174', ...(process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] : [])],
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru }, translations: { ru: { authentication: { username: 'Логин' } } } },
  admin: {
    user: 'users', theme: 'light',
    dateFormat: 'dd.MM.yyyy HH:mm',
    meta: { titleSuffix: ' — КСМ · Управление сайтом', icons: [{ rel: 'icon', url: '/clinic-logo.webp' }] },
    importMap: { baseDir: dirname, importMapFile: path.resolve(dirname, 'app/(payload)/admin/importMap.ts') },
    timezones: { defaultTimezone: 'Europe/Moscow', supportedTimezones: [{ label: 'Казань / Москва (UTC+3)', value: 'Europe/Moscow' }] },
    components: { graphics: { Logo: '/components/Brand#Logo', Icon: '/components/Brand#Icon' }, beforeDashboard: ['/components/Dashboard#Dashboard'], beforeLogin: ['/components/Brand#LoginIntro'], afterNavLinks: ['/components/Brand#SiteLink'] },
    livePreview: { url: ({ collectionConfig, data }) => {
      const base = process.env.SITE_URL || 'http://localhost:4173/medic_corp'
      const routes: Record<string, string> = { specialists: `specialists/?doctor=${data.key}`, services: `services/?service=${data.key}`, news: `news/?post=${data.key}`, promotions: `offers/?offer=${data.key}`, pages: ['about', 'patients', 'oms'].includes(data.key) ? `${data.key}/` : `pages/?page=${data.key}` }
      const route = collectionConfig ? routes[collectionConfig.slug] || '' : ''
      return `${base}/${route}${route.includes('?') ? '&' : '?'}preview=1`
    }, collections: ['specialists', 'services', 'news', 'promotions', 'pages'], globals: ['homepage', 'clinic'] },
  },
  editor: lexicalEditor({ features: () => [ParagraphFeature(), HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }), BoldFeature(), ItalicFeature(), UnderlineFeature(), OrderedListFeature(), UnorderedListFeature(), LinkFeature({ enabledCollections: [] }), BlockquoteFeature(), FixedToolbarFeature(), InlineToolbarFeature()] }),
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URL || `file:${path.resolve(dirname, 'data/clinic.db')}` }, push: process.env.NODE_ENV !== 'production' }),
  collections: collections.map(collection => collection.upload && typeof collection.upload === 'object' ? { ...collection, upload: { ...collection.upload, staticDir: path.resolve(process.env.CMS_STORAGE_ROOT || dirname, collection.upload.staticDir!) } } : collection),
  globals,
  endpoints: [{ path: '/site', method: 'get', handler: publicSnapshot }, { path: '/document-file/:filename', method: 'get', handler: documentFile }, { path: '/document/:key', method: 'get', handler: currentDocument }],
  sharp,
  upload: { limits: { fileSize: 15 * 1024 * 1024 } },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
