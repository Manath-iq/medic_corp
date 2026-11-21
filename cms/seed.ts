import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from './payload.config'
import specialists from '../src/specialists.json'
import services from '../src/services.json'
import { initialPages } from './initial-pages'
import { preserveDocument } from './document-files'

export const richText = (paragraphs: string[]) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children: paragraphs.map(value => ({ type: 'paragraph', format: '', indent: 0, version: 1, direction: null, textFormat: 0, textStyle: '', children: [{ type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] })) } })

const payload = await getPayload({ config })
const username = process.env.SEED_ADMIN_USERNAME || 'admin'
const password = process.env.SEED_ADMIN_PASSWORD
if (!password) throw new Error('Укажите SEED_ADMIN_USERNAME и SEED_ADMIN_PASSWORD в cms/.env.local')
const users = await payload.count({ collection: 'users' })
if (!users.totalDocs) await payload.create({ collection: 'users', data: { name: 'Администратор клиники', username, password, role: 'admin' }, overrideAccess: true })

// Seed is explicitly local, repeatable and never overwrites an existing record.
async function ensure(collection: string, data: Record<string, any>, filePath?: string) {
  const existing = await payload.find({ collection, where: { [data.key ? 'key' : 'alt']: { equals: data.key || data.alt } }, limit: 1 })
  if (existing.docs[0]) return existing.docs[0]
  return payload.create({ collection, data: { ...data, ...(collection === 'media' ? {} : { _status: 'published' }) }, ...(filePath ? { filePath } : {}) })
}
const row = (text: string) => ({ text })
const media: Record<string, any> = {}
for (const doctor of specialists.doctors) media[doctor.image] = await ensure('media', { alt: `${doctor.name} ${doctor.given}`, credit: 'Материалы клиники' }, path.resolve('public/assets/clinic', doctor.image))
for (const [key, file, alt] of [
  ['hero', 'hero-lab.webp', 'Художественная визуализация лабораторного натюрморта'],
  ...['reproduction', 'gynecology', 'embryology', 'diagnostics', 'genetics', 'andrology'].map(key => [key, `direction-${key}.webp`, services.categories.find(x => x.id === key)?.title || key]),
]) media[key] = await ensure('media', { alt, generated: true, credit: 'Художественная визуализация проекта' }, path.resolve('src/assets/generated', file))
const directionIDs: Record<string, any> = {}
for (const [order, direction] of services.categories.entries()) {
  directionIDs[direction.id] = (await ensure('directions', { key: direction.id, title: direction.title, description: direction.description, note: direction.description, image: media[direction.id]?.id, showOnHome: direction.id !== 'therapy', order })).id
}
const doctorIDs: Record<string, any> = {}
for (const [order, doctor] of specialists.doctors.entries()) doctorIDs[doctor.id] = (await ensure('specialists', { ...doctor, id: undefined, key: doctor.id, photo: media[doctor.image].id, directions: [directionIDs[doctor.direction]], education: doctor.education.map(row), topics: doctor.topics.map(row), accreditation: doctor.accreditation.map(row), showOnHome: true, available: true, order })).id
for (const [order, service] of services.services.entries()) {
  const price = await ensure('prices', { key: service.id, title: service.title, sourceCode: service.sourceCode, ...service.price, effectiveAt: '2026-11-17T09:00:00.000Z', order })
  await ensure('services', { key: service.id, title: service.title, summary: service.summary, description: service.description, direction: directionIDs[service.categoryId], includes: service.includes.map(row), preparation: service.preparation, doctors: service.doctorIds.map(id => doctorIDs[id]), prices: [price.id], showOnHome: ['reproductologist-first', 'reproductologist-follow-up', 'embryologist', 'urologist-first', 'therapist-first'].includes(service.id), order })
}
const docTitles: Record<string, string> = {
  '19-politika-invalidov': 'Помощь маломобильным пациентам', 'n3867-p-ot18-12-25-lekastven-preparati': 'Перечни лекарств', 'pol-bezapasnosti-ksm': 'Политика обработки персональных данных', 'pologenie-o-med-uslugah': 'Положение КСМ о платных услугах', 'pologenie-o-pritenziah-19': 'Порядок рассмотрения претензий', 'poston-rf-30-06-1994-890': 'Бесплатное и льготное обеспечение лекарствами', 'prais-06-04-26-ksm-v1': 'Полный прайс клиники', 'prava-i-obazonosti-2021': 'Права и обязанности пациентов', 'pravila-dla-pacientov-19': 'Правила внутреннего распорядка', 'vidu-med-pomoshi-21': 'Виды медицинской помощи',
}
const documentIDs: Record<string, any> = {}
for (const file of fs.readdirSync('public/documents').filter(f => f.endsWith('.pdf'))) {
  const key = file.replace(/\.pdf$/, '')
  documentIDs[key] = (await ensure('documents', { key, title: docTitles[key] || key, category: key.startsWith('prais') ? 'Прайс' : 'Пациентам', version: 'Перенесено из текущего сайта' }, path.resolve('public/documents', file))).id
}
for (const n of [1, 2, 3]) documentIDs[`license-${n}`] = (await ensure('documents', { key: `license-${n}`, title: `Выписка из реестра лицензий · страница ${n}`, category: 'Лицензия', version: '28 апреля 2026' }, path.resolve(`public/assets/license/extract-${n}.jpg`))).id
for (const p of initialPages) await ensure('pages', { key: p.key, title: p.title, lead: p.lead, sections: p.sections.map(s => ({ anchor: s.anchor, title: s.title, body: richText(s.paragraphs), links: 'links' in s ? s.links : [], documents: 'documents' in s ? s.documents?.map(key => documentIDs[key]).filter(Boolean) : [] })) })

// Preserve the existing FAQ and reviews from their trusted local source without
// importing Vite's import.meta.env into the server.
const dataSource = fs.readFileSync('src/data.ts', 'utf8')
const faqLiteral = dataSource.match(/export const questions = (\[[\s\S]*?\]) as const/)?.[1]
const clinicLinks = { phoneHref: 'tel:+78432769535', firstVisitUrl: '/medic_corp/patients/#first-visit', regionalOmsUrl: '/medic_corp/oms/#regions', omsUrl: '/medic_corp/oms/', preparationUrl: '/medic_corp/patients/#preparation', priceListUrl: '/medic_corp/services/#catalog' }
if (faqLiteral) {
  const questions = new Function('clinic', `return (${faqLiteral})`)(clinicLinks)
  for (const [order, q] of questions.entries()) {
    const existing = await payload.find({ collection: 'faq', where: { title: { equals: q.question } }, limit: 1 })
    if (!existing.totalDocs) await payload.create({ collection: 'faq', data: { title: q.question, answer: q.answer, href: q.href, linkLabel: q.label, placement: ['home'], order, _status: 'published' } })
  }
}
const reviewSource = fs.readFileSync('src/yandex.ts', 'utf8').split('export const yandexReviews = ')[1]?.replace(/as const\s*$/, '')
for (const [order, [title, answer, href, linkLabel]] of [
  ['Можно записаться сразу на исследование?', 'Позвоните в регистратуру и назовите исследование. Администратор уточнит порядок записи и подготовку. Необходимость обследования обсуждается с врачом.', '', ''],
  ['Все услуги входят в указанную стоимость?', 'В карточке указан состав конкретной позиции. Дополнительные консультации и исследования могут оплачиваться отдельно. Итоговую стоимость уточните до визита.', '', ''],
  ['Где узнать об ЭКО по ОМС?', 'Условия программы и порядок обращения опубликованы на сайте клиники.', '/medic_corp/oms/', 'Об ЭКО по ОМС'],
].entries()) {
  const existing = await payload.find({ collection: 'faq', where: { title: { equals: title } }, limit: 1 })
  if (!existing.totalDocs) await payload.create({ collection: 'faq', data: { title, answer, href, linkLabel, placement: ['services'], order, _status: 'published' } })
}
if (reviewSource) for (const [order, r] of new Function(`return (${reviewSource})`)().entries()) {
  const existing = await payload.find({ collection: 'reviews', where: { title: { equals: r.author } }, limit: 1 })
  if (!existing.totalDocs) await payload.create({ collection: 'reviews', data: { title: r.author, quote: r.quote, dateLabel: r.dateLabel, rating: r.rating, excerpt: r.excerpt, sourceUrl: 'https://yandex.ru/maps/org/klinika_semeynoy_meditsiny/1664726921/reviews/', order, _status: 'published' } })
}

const clinic = await payload.findGlobal({ slug: 'clinic' })
if (!clinic.name) await payload.updateGlobal({ slug: 'clinic', data: { name: 'Клиника семейной медицины', phone: '+7 (843) 276-95-35', extraPhone: '+7 (962) 559-39-89', email: 'ksm-eko.kazan@mail.ru', address: 'Казань, ул. Зур Урам, 33', hours: 'Пн–пт 08:00–16:00 · Сб 08:00–14:00 · Вс выходной', mapAddress: 'Зур Урам, 33/22', lat: 55.808999, lng: 49.194170, routeUrl: 'https://yandex.ru/maps/?rtext=~55.808999,49.194170&rtt=auto', mapUrl: 'https://yandex.ru/maps/org/klinika_semeynoy_meditsiny/1664726921/', reviewsUrl: 'https://yandex.ru/maps/org/klinika_semeynoy_meditsiny/1664726921/reviews/', prodoctorovUrl: 'https://prodoctorov.ru/kazan/lpu/39363-ksm/otzivi/', legalName: 'ООО «Клиника семейной медицины»', inn: '1657052423', ogrn: '1051629014128', license: 'Лицензия № Л041-01181-16/00327408 предоставлена 14 мая 2019 года Министерством здравоохранения Республики Татарстан.', warning: 'Имеются противопоказания. Необходима консультация специалиста.', licenseDocuments: [1, 2, 3].map(n => documentIDs[`license-${n}`]), priceDocument: documentIDs['prais-06-04-26-ksm-v1'], priceDocumentVersion: '6 апреля 2026', _status: 'published' } })
const homepage = await payload.findGlobal({ slug: 'homepage' })
if (!homepage.title) await payload.updateGlobal({ slug: 'homepage', data: { context: 'Репродуктивное здоровье · Казань', title: 'Большая мечта\nначинается\nс первого шага.', mobileTitle: 'Лечение бесплодия\nи ЭКО.', lead: 'Диагностика, лечение бесплодия и ЭКО.\nРядом, чтобы помочь вам найти свой путь.', mobileLead: 'Репродуктологи, гинекологи и эмбриологи в Казани.', heroImage: media.hero.id, imageCaption: 'Здесь зарождается жизнь', ctaLabel: 'Записаться на приём', trust: [{ title: 'Команда', text: 'Репродуктологи и эмбриологи ведут приём в одной клинике.' }, { title: 'Диагностика', text: 'В клинике проводят УЗИ и лабораторные исследования.' }, { title: 'ЭКО по ОМС', text: 'Условия программы можно уточнить в регистратуре.' }], _status: 'published' } })
await ensure('news', { key: 'donor-program', title: 'Приглашаем стать донорами ооцитов', excerpt: 'Объявление клиники о донорской программе.', body: richText(['По вопросам участия в донорской программе можно обратиться к ведущему эмбриологу Елене Андреевне Жиряевой.', 'Телефон по вопросам донорства: +7 (987) 415-53-80.']), publishedAt: '2026-11-17T09:00:00.000Z', showOnHome: true })
for (const document of (await payload.find({ collection: 'documents', pagination: false, depth: 0 })).docs) await preserveDocument(document.filename)
console.log('Локальная база подготовлена. Существующие записи сохранены. Данные прототипа требуют проверки клиники перед рабочим запуском.')
await payload.destroy()
