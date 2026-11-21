import type { Access, CollectionConfig, Field, GlobalConfig, CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { randomBytes } from 'node:crypto'
import { retainDocumentFile } from './document-files'

export const staff = ({ req }: { req: PayloadRequest }) => Boolean(req.user)
export const administrator = ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin'
export const published: Access = ({ req }) => req.user ? true : { _status: { equals: 'published' } }
const versioning = { drafts: { autosave: { interval: 2500 } }, maxPerDoc: 50 }
const text = (name: string, label: string, required = false): Field => ({ name, label, type: 'text', required })
const url = (name: string, label: string): Field => ({ name, label, type: 'text', validate: (value: unknown) => !value || typeof value === 'string' && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) || 'Укажите https://, телефон tel: или внутреннюю ссылку, начинающуюся с /.' })
const area = (name: string, label: string, required = false): Field => ({ name, label, type: 'textarea', required })
const rows = (name: string, label: string): Field => ({ name, label, type: 'array', fields: [text('text', 'Текст', true)] })
const order: Field = { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Меньшее число — выше в списке.' } }
const editedBy: Field = { name: 'editedBy', label: 'Кто изменил', type: 'text', admin: { position: 'sidebar', readOnly: true }, access: { read: staff, create: () => false, update: () => false } }
const key: Field = { name: 'key', label: 'Постоянный адрес / код', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar', readOnly: true, description: 'Создаётся автоматически при сохранении.' }, validate: (value: unknown) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || 'Используйте латинские буквы, цифры и дефисы.' }
const image = (name = 'image', label = 'Изображение'): Field => ({ name, label, type: 'upload', relationTo: 'media' })
const relation = (name: string, label: string, relationTo: string, hasMany = false): Field => hasMany ? ({ name, label, type: 'relationship', relationTo, hasMany: true }) : ({ name, label, type: 'relationship', relationTo, hasMany: false })
const seo: Field = { type: 'collapsible', label: 'Для поисковых систем', admin: { initCollapsed: true }, fields: [text('seoTitle', 'Заголовок страницы'), area('seoDescription', 'Описание страницы')] }

const stableKey: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (originalDoc?.key && data.key && data.key !== originalDoc.key) throw new APIError('Постоянный код нельзя менять: на него ссылаются страницы сайта. Создайте новую запись или обратитесь к администратору.', 400)
  return data
}

function generateKey(value: string) {
  const latin = ['a','b','v','g','d','e','yo','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','sch','','y','','e','yu','ya']
  const russian = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
  return [...value.toLowerCase()].map(char => russian.includes(char) ? latin[russian.indexOf(char)] : char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-$/, '') || 'material'
}

function content(slug: string, singular: string, plural: string, fields: Field[], group = 'Контент сайта'): CollectionConfig {
  return {
    slug, labels: { singular, plural },
    admin: { group, useAsTitle: 'title', defaultColumns: ['title', '_status', 'updatedAt'] },
    access: { read: published, create: staff, update: staff, delete: administrator, readVersions: staff },
    versions: versioning,
    defaultSort: 'order',
    fields: [...fields, order, editedBy],
    hooks: {
      beforeValidate: [async ({ data, operation, req }) => {
        if (operation !== 'create' || !fields.some(f => 'name' in f && f.name === 'key') || data?.key) return data
        const base = generateKey(data?.title || data?.name || 'material')
        const existing = await req.payload.count({ collection: slug, where: { key: { equals: base } }, req, overrideAccess: true })
        return { ...data, key: existing.totalDocs ? `${base}-${randomBytes(4).toString('hex')}` : base }
      }],
      beforeChange: [stableKey, ({ data, req }) => ({ ...data, editedBy: req.user?.name || req.user?.email || 'Перенос данных' })],
      // Archive instead: destructive removal of referenced content needs an explicit migration.
      beforeDelete: [() => { throw new APIError('Снимите запись с публикации. Удаление связанных материалов выполняется при техническом обслуживании.', 400) }],
    },
  }
}

export const Users: CollectionConfig = {
  slug: 'users', labels: { singular: 'Сотрудник', plural: 'Сотрудники и доступ' },
  auth: { loginWithUsername: { allowEmailLogin: false, requireEmail: false, requireUsername: true }, tokenExpiration: 60 * 60 * 8, maxLoginAttempts: 5, lockTime: 10 * 60 * 1000, cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' } },
  admin: { useAsTitle: 'name', group: 'Администрирование', defaultColumns: ['name', 'username', 'role'] },
  access: {
    create: administrator, delete: administrator,
    read: ({ req }) => req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false,
    update: ({ req }) => req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false,
    admin: staff,
  },
  fields: [text('name', 'Имя сотрудника', true), {
    name: 'username', label: 'Логин', type: 'text', required: true, unique: true,
    admin: { description: 'Например: Анна, Иванова или anna. Логин должен быть уникальным. Регистр букв не важен.' },
    validate: (value: unknown) => typeof value === 'string' && /^[\p{L}\p{N}_.-]{2,50}$/u.test(value.trim()) || 'От 2 до 50 букв, цифр, точек, дефисов или подчёркиваний. Без пробелов.',
  }, { name: 'email', type: 'email', required: false, admin: { hidden: true } }, {
    name: 'role', label: 'Доступ', type: 'select', required: true, defaultValue: 'editor',
    options: [{ label: 'Редактор — ведение и публикация сайта', value: 'editor' }, { label: 'Администратор — сайт и доступ сотрудников', value: 'admin' }],
    access: { create: administrator, update: administrator },
  }],
  hooks: {
    beforeOperation: [({ args, operation }) => {
      if (operation === 'forgotPassword' || operation === 'resetPassword') throw new APIError('Восстановление пароля отключено.', 403)
      return args
    }],
    beforeChange: [async ({ data, originalDoc, req }) => {
      if (originalDoc?.role === 'admin' && data.role && data.role !== 'admin') {
        const count = await req.payload.count({ collection: 'users', where: { role: { equals: 'admin' } }, req })
        if (count.totalDocs <= 1) throw new APIError('Сначала назначьте другого администратора.', 400)
      }
      return data
    }],
    beforeDelete: [async ({ id, req }) => {
      const user = await req.payload.findByID({ collection: 'users', id, req })
      if (user.role === 'admin' && (await req.payload.count({ collection: 'users', where: { role: { equals: 'admin' } }, req })).totalDocs <= 1) throw new APIError('Нельзя удалить последнего администратора.', 400)
    }],
  },
}

export const Media: CollectionConfig = {
  slug: 'media', labels: { singular: 'Изображение', plural: 'Изображения' },
  admin: { useAsTitle: 'alt', group: 'Файлы', defaultColumns: ['filename', 'alt', 'updatedAt'], description: 'Чтобы заменить фотографию, загрузите новое изображение и выберите его в карточке. Исходные файлы сохраняются для истории.' },
  access: { read: () => true, create: staff, update: staff, delete: () => false },
  upload: { staticDir: 'uploads/media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], imageSizes: [{ name: 'card', width: 720, height: 960, position: 'centre' }, { name: 'thumbnail', width: 160, height: 160 }], adminThumbnail: 'thumbnail' },
  fields: [text('alt', 'Описание изображения', true), text('credit', 'Источник / автор'), { name: 'generated', label: 'Художественная визуализация', type: 'checkbox', defaultValue: false }],
  hooks: { beforeOperation: [({ args, operation }) => {
    if (['update', 'updateByID'].includes(operation) && args.req?.file) throw new APIError('Загрузите новое изображение отдельной записью и выберите его в карточке. Так сохранятся предыдущие версии фотографий.', 400)
    return args
  }] },
}

export const Directions = content('directions', 'Направление', 'Направления', [key, text('title', 'Название', true), area('description', 'Описание'), image(), text('tag', 'Короткая подпись'), area('note', 'Текст карточки'), { name: 'showOnHome', label: 'Показывать на главной', type: 'checkbox', defaultValue: true }], 'Каталог клиники')

export const Specialists = content('specialists', 'Специалист', 'Специалисты', [key, {
  type: 'tabs', tabs: [
    { label: 'Основное', fields: [text('name', 'Фамилия', true), text('given', 'Имя и отчество', true), text('role', 'Специальности и должность', true), text('detail', 'Короткая подпись'), image('photo', 'Фотография'), relation('directions', 'Направления', 'directions', true)] },
    { label: 'О специалисте', fields: [rows('topics', 'С чем можно обратиться'), rows('education', 'Образование и повышение квалификации'), { name: 'accreditation', label: 'Аккредитация', type: 'array', fields: [text('text', 'Специальность и документ', true), { name: 'expiresAt', label: 'Действует до', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } }] }] },
    { label: 'Приём', fields: [text('schedule', 'График приёма'), { name: 'available', label: 'Принимает пациентов', type: 'checkbox', defaultValue: true }, { name: 'showOnHome', label: 'Показывать на главной', type: 'checkbox', defaultValue: true }, { name: 'showDetail', label: 'Показывать короткую подпись в профиле', type: 'checkbox', defaultValue: true }] },
  ],
}, seo], 'Каталог клиники')
Specialists.admin = { ...Specialists.admin, useAsTitle: 'name', defaultColumns: ['name', 'given', 'role', '_status'] }
Specialists.hooks!.beforeDelete = [async ({ id, req }) => {
  // Check both published data and the latest draft. Historical versions are
  // not live references; deletion of an unused card must remain possible.
  const references = new Set<string>()
  for (const draft of [false, true]) {
    for (const [collection, field, label] of [['services', 'doctors', 'Услуги'], ['prices', 'specialist', 'Цены']] as const) {
      const result = await req.payload.find({
        collection, draft, depth: 0, pagination: false,
        where: { [field]: { equals: id } }, req, overrideAccess: true,
      })
      for (const doc of result.docs) references.add(`${label}: «${doc.title || doc.id}» (ID ${doc.id})`)
    }
  }
  if (references.size) throw new APIError(`Специалист используется: ${[...references].join('; ')}. Уберите его из этих записей и сохраните изменения, затем повторите удаление. Проверьте также черновики.`, 400)
}]

export const Prices = content('prices', 'Позиция прайса', 'Цены', [
  key, text('title', 'Официальное название', true), text('sourceCode', 'Код в прайсе'),
  { name: 'kind', label: 'Тип стоимости', type: 'select', required: true, defaultValue: 'fixed', options: [{ value: 'fixed', label: 'Фиксированная цена' }, { value: 'from', label: 'От указанной суммы' }, { value: 'oms', label: 'По ОМС' }, { value: 'onRequest', label: 'Нужно уточнить состав / стоимость' }] },
  { name: 'amount', label: 'Цена, ₽', type: 'number', min: 0, admin: { condition: (_, sibling) => ['fixed', 'from'].includes(sibling.kind), step: 0.01 } },
  area('note', 'Что входит / условия стоимости'), text('variant', 'Вариант: например, первичный приём'), relation('specialist', 'Цена для конкретного специалиста', 'specialists'),
  { name: 'effectiveAt', label: 'Дата актуальности', type: 'date', admin: { description: 'Дата утверждения. Изменения вступают в силу при публикации.', date: { pickerAppearance: 'dayOnly' } } },
], 'Каталог клиники')
Prices.admin = { ...Prices.admin, defaultColumns: ['title', 'amount', 'kind', '_status', 'updatedAt'] }
Prices.hooks!.beforeChange!.push(({ data, originalDoc }) => {
  const value = { ...originalDoc, ...data }
  if (value._status === 'published' && ['fixed', 'from'].includes(value.kind) && (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount < 0)) throw new APIError('Для публикации укажите цену в рублях, не меньше нуля.', 400)
  if (typeof value.amount === 'number' && Math.abs(value.amount * 100 - Math.round(value.amount * 100)) > 0.00001) throw new APIError('В цене допускается не больше двух знаков после запятой.', 400)
  if (['oms', 'onRequest'].includes(value.kind)) data.amount = null
  return data
})

export const Services = content('services', 'Услуга', 'Услуги', [key, {
  type: 'tabs', tabs: [
    { label: 'Основное', fields: [text('title', 'Название для пациента', true), text('summary', 'Короткое описание'), { ...relation('direction', 'Направление', 'directions'), required: true } as Field, area('description', 'Об услуге', true)] },
    { label: 'Состав и подготовка', fields: [rows('includes', 'Что входит'), area('preparation', 'Перед визитом')] },
    { label: 'Цены и специалисты', fields: [relation('prices', 'Позиции общего прайса', 'prices', true), relation('doctors', 'Кто оказывает услугу', 'specialists', true), { name: 'showOnHome', label: 'В ценах на главной', type: 'checkbox', defaultValue: false }] },
  ],
}, seo], 'Каталог клиники')

const postFields: Field[] = [key, text('title', 'Заголовок', true), area('excerpt', 'Короткое описание'), image('cover', 'Обложка'), { name: 'body', label: 'Текст', type: 'richText' }, relation('services', 'Связанные услуги', 'services', true), { name: 'showOnHome', label: 'Показывать на главной', type: 'checkbox', defaultValue: true }, seo]
Services.hooks!.beforeChange!.push(async ({ data, originalDoc, req }) => {
  const value = { ...originalDoc, ...data }
  if (value._status !== 'published') return data
  if (!Array.isArray(value.prices) || value.prices.length === 0) throw new APIError('Выберите хотя бы одну позицию прайса. Для ОМС или стоимости по запросу создайте позицию соответствующего типа.', 400)
  for (const reference of value.prices) {
    const id = typeof reference === 'object' ? reference.id : reference
    const price = await req.payload.findByID({ collection: 'prices', id, depth: 0, draft: false, req })
    if (price._status !== 'published') throw new APIError('Сначала опубликуйте выбранные позиции прайса, затем услугу.', 400)
  }
  return data
})
export const News = content('news', 'Новость', 'Новости', [...postFields, { name: 'publishedAt', label: 'Дата публикации', type: 'date', defaultValue: () => new Date().toISOString(), required: true, admin: { description: 'Дата отображения. Кнопка «Опубликовать» размещает материал сразу.', date: { pickerAppearance: 'dayOnly' } } }])
News.defaultSort = '-publishedAt'
export const Promotions = content('promotions', 'Акция', 'Акции', [...postFields, text('benefit', 'Предложение: например, скидка 10%'), { type: 'row', fields: [{ name: 'startsAt', label: 'Начало, по времени Казани', type: 'date', required: true }, { name: 'endsAt', label: 'Окончание, по времени Казани', type: 'date', required: true }] }, area('conditions', 'Условия и ограничения', true)])
Promotions.access!.read = ({ req }): ReturnType<Access> => req.user ? true : { and: [{ _status: { equals: 'published' } }, { startsAt: { less_than_equal: new Date().toISOString() } }] }
Promotions.hooks!.beforeChange!.push(({ data, originalDoc }) => {
  const value = { ...originalDoc, ...data }
  if (value.startsAt && value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) throw new APIError('Окончание акции должно быть позже начала.', 400)
  return data
})

export const Documents: CollectionConfig = {
  ...content('documents', 'Документ', 'Документы', [key, text('title', 'Название', true), { name: 'category', label: 'Раздел', type: 'select', options: ['Лицензия', 'Пациентам', 'ОМС', 'Прайс', 'Организация', 'Персональные данные'], defaultValue: 'Пациентам' }, text('version', 'Версия / дата документа'), area('description', 'Описание')], 'Файлы'),
  upload: { staticDir: 'uploads/documents', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] },
}
Documents.hooks!.afterChange = [retainDocumentFile]
Documents.hooks!.beforeOperation = [async ({ args, operation }) => {
  const req = args.req
  if (!req) return args
  if (operation === 'restoreVersion') {
    if (!req.user) throw new APIError('Для восстановления документа войдите в админку.', 403)
    // Use only trusted metadata from this collection's stored version, never
    // filename/mime fields supplied by the browser. Keep normal access checks.
    const saved = await req.payload.findVersionByID({ collection: 'documents', id: String(args.id), req, overrideAccess: false })
    req.context.restoreDocumentFile = { parent: saved.parent, filename: saved.version.filename, mimeType: saved.version.mimeType, filesize: saved.version.filesize, width: saved.version.width, height: saved.version.height }
  }
  if (['create', 'update', 'updateByID'].includes(operation) && req.file) {
    const file = req.file
    const dot = file.name.lastIndexOf('.')
    file.name = `${file.name.slice(0, dot)}-${randomBytes(8).toString('hex')}${file.name.slice(dot)}`
  }
  return args
}]
Documents.hooks!.beforeChange!.push(({ data, originalDoc, req }) => {
  const saved = req.context.restoreDocumentFile as Record<string, any> | undefined
  if (req.context.isRestoringVersion && saved) {
    const parent = typeof saved.parent === 'object' ? saved.parent.id : saved.parent
    if (parent !== originalDoc.id) throw new APIError('Версия относится к другому документу.', 400)
    const { parent: _, ...file } = saved
    Object.assign(data, file)
  }
  return data
})
Documents.hooks!.afterRead = [({ doc }) => {
  if (doc.filename) doc.url = `${process.env.CMS_URL || 'http://localhost:3001'}/api/document-file/${encodeURIComponent(doc.filename)}`
  return doc
}]

export const Pages = content('pages', 'Страница', 'Страницы и памятки', [key, text('title', 'Заголовок', true), area('lead', 'Вступление'), image(), {
  name: 'sections', label: 'Разделы страницы', type: 'array', fields: [text('anchor', 'Якорь раздела (латиницей)', true), text('title', 'Заголовок раздела', true), { name: 'body', label: 'Текст', type: 'richText' }, relation('documents', 'Документы', 'documents', true), { name: 'links', label: 'Ссылки', type: 'array', fields: [text('label', 'Подпись', true), { ...url('href', 'Адрес ссылки'), required: true } as Field] }],
}, seo])
export const FAQ = content('faq', 'Вопрос', 'Вопросы и ответы', [text('title', 'Вопрос', true), area('answer', 'Ответ', true), text('linkLabel', 'Подпись ссылки'), url('href', 'Ссылка'), { name: 'placement', label: 'Где показывать', type: 'select', hasMany: true, defaultValue: ['home'], options: [{ label: 'Главная', value: 'home' }, { label: 'Каталог услуг', value: 'services' }] }])
export const Reviews = content('reviews', 'Отзыв', 'Отзывы', [text('title', 'Имя автора', true), area('quote', 'Текст отзыва', true), text('dateLabel', 'Дата, как в источнике'), text('sourceUrl', 'Ссылка на источник'), { name: 'rating', label: 'Оценка', type: 'number', min: 1, max: 5 }, { name: 'excerpt', label: 'Это фрагмент отзыва', type: 'checkbox' }])

function settings(slug: string, label: string, fields: Field[]): GlobalConfig {
  return { slug, label, admin: { group: 'Настройки сайта' }, access: { read: staff, update: staff, readVersions: staff }, versions: { drafts: { autosave: { interval: 2500 } }, max: 40 }, fields: [...fields, editedBy], hooks: { beforeChange: [({ data, req }) => ({ ...data, editedBy: req.user?.name || req.user?.email || 'Перенос данных' })] } }
}
export const Clinic = settings('clinic', 'Контакты и клиника', [
  { type: 'tabs', tabs: [
    { label: 'Контакты', fields: [text('name', 'Название клиники', true), text('phone', 'Телефон регистратуры', true), text('extraPhone', 'Дополнительный телефон'), text('email', 'Электронная почта'), text('address', 'Адрес', true), text('hours', 'Часы работы', true), area('holidayHours', 'Изменения графика / праздничные дни'), text('mapAddress', 'Адрес на карте'), text('routeUrl', 'Ссылка на маршрут'), text('mapUrl', 'Страница клиники на Яндекс Картах'), { name: 'lat', label: 'Широта', type: 'number', min: -90, max: 90 }, { name: 'lng', label: 'Долгота', type: 'number', min: -180, max: 180 }] },
    { label: 'Организация', fields: [text('legalName', 'Юридическое наименование'), text('inn', 'ИНН'), text('ogrn', 'ОГРН'), text('license', 'Лицензия'), relation('licenseDocuments', 'Документы лицензии', 'documents', true), area('warning', 'Медицинское предупреждение')] },
    { label: 'Прайс и отзывы', fields: [relation('priceDocument', 'Полный прайс PDF', 'documents'), text('priceDocumentVersion', 'Версия / дата загруженного прайса'), text('reviewsUrl', 'Все отзывы на Яндекс Картах'), text('prodoctorovUrl', 'Отзывы на ПроДокторов')] },
    { label: 'Объявление', fields: [area('notice', 'Временное объявление'), { name: 'noticeUntil', label: 'Показывать до', type: 'date' }] },
  ] },
])
export const Homepage = settings('homepage', 'Главная страница', [
  text('context', 'Надпись над заголовком'), area('title', 'Главный заголовок', true), area('mobileTitle', 'Короткий заголовок на телефоне'), area('lead', 'Описание'), area('mobileLead', 'Короткое описание на телефоне'), image('heroImage', 'Главное изображение'), text('imageCaption', 'Подпись изображения'), text('ctaLabel', 'Кнопка обращения'),
  { name: 'trust', label: 'Факты о клинике', type: 'array', maxRows: 4, fields: [text('title', 'Заголовок', true), area('text', 'Текст', true)] },
  { type: 'ui', name: 'homeHelp', admin: { components: { Field: '/components/Brand#HomeHelp' } } },
])

export const collections = [Users, Specialists, Directions, Services, Prices, News, Promotions, Pages, FAQ, Reviews, Media, Documents]
export const globals = [Clinic, Homepage]
