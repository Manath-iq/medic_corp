import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { getPayload, createLocalReq } from 'payload'

const directory = fs.mkdtempSync(path.resolve(process.env.TMPDIR || '/private/var/folders/3z/v8232dhd2413k9_l57gry83m0000gn/T/opencode', 'clinic-cms-test-'))
process.env.PAYLOAD_SECRET = randomBytes(48).toString('hex')
process.env.DATABASE_URL = `file:${directory}/test.db`
process.env.CMS_STORAGE_ROOT = directory
const { default: config } = await import('../cms/payload.config')
const { publicSnapshot } = await import('../cms/snapshot')
const { currentDocument, documentFile } = await import('../cms/document-files')
const payload = await getPayload({ config })
let checks = 0
function check(name: string, condition: unknown) { assert.ok(condition, name); console.log(`✓ ${name}`); checks++ }
async function denied(name: string, operation: () => Promise<unknown>) {
  await assert.rejects(operation); console.log(`✓ ${name}`); checks++
}
try {
  const admin = await payload.create({ collection: 'users', data: { username: 'admin', password: randomBytes(20).toString('hex'), name: 'Тестовый администратор', role: 'admin' } })
  const editorPassword = randomBytes(20).toString('hex')
  const editor = await payload.create({ collection: 'users', data: { username: 'Иванова', password: editorPassword, name: 'Тестовый редактор', role: 'editor' } })
  check('Вход по кириллическому логину без email', (await payload.login({ collection: 'users', data: { username: 'ИВАНОВА', password: editorPassword } })).user.id === editor.id)
  await denied('Неверный пароль не принимается', () => payload.login({ collection: 'users', data: { username: 'иванова', password: 'wrong-password' } }))
  await denied('Одинаковые логины с разным регистром запрещены', () => payload.create({ collection: 'users', data: { username: 'ИВАНОВА', password: editorPassword, name: 'Другой сотрудник', role: 'editor' } }))
  await denied('Запрос восстановления пароля отключён', () => payload.forgotPassword({ collection: 'users', data: { email: 'admin@test.local' } }))
  await denied('Сброс пароля отключён', () => payload.resetPassword({ collection: 'users', data: { token: 'test-token', password: 'test-password' }, overrideAccess: true }))
  const user = { ...editor, collection: 'users' as const }
  const adminUser = { ...admin, collection: 'users' as const }
  const write = { overrideAccess: false, user }
  await denied('Без входа нельзя изменить контент', () => payload.create({ collection: 'news', data: { title: 'Чужая запись', publishedAt: new Date().toISOString(), _status: 'published' }, overrideAccess: false }))
  await denied('Редактор не может создавать учётные записи', () => payload.create({ collection: 'users', data: { name: 'Посторонний', username: 'other', password: 'not-real-credentials' }, ...write }))
  await payload.update({ collection: 'users', id: user.id, data: { role: 'admin' }, ...write })
  check('Редактор не может повысить собственные права', (await payload.findByID({ collection: 'users', id: user.id })).role === 'editor')

  const direction = await payload.create({ collection: 'directions', data: { key: 'test-direction', title: 'Тестовое направление', _status: 'published' }, ...write })
  const doctor = await payload.create({ collection: 'specialists', data: { key: 'test-doctor', name: 'Тестовый', given: 'Специалист', role: 'Врач', directions: [direction.id], _status: 'published' }, ...write })
  const price = await payload.create({ collection: 'prices', data: { key: 'test-price', title: 'Тестовая консультация', kind: 'fixed', amount: 4500, _status: 'published' }, ...write })
  await payload.create({ collection: 'services', data: { key: 'test-service', title: 'Тестовая услуга', description: 'Описание', direction: direction.id, prices: [price.id], doctors: [doctor.id], showOnHome: true, _status: 'published' }, ...write })
  const snapshot = async (preview = false, authenticated = false) => {
    const req = await createLocalReq(authenticated ? { user } : {}, payload)
    req.query = preview ? { preview: '1' } : {}
    return publicSnapshot(req)
  }
  const current = async () => (await (await snapshot()).json()) as any
  check('Связанные врач, услуга и цена доступны на сайте', (await current()).services[0].price.amount === 4500 && (await current()).services[0].doctorIds[0] === 'test-doctor')
  await payload.update({ collection: 'prices', id: price.id, data: { amount: 5100, _status: 'draft' }, draft: true, ...write })
  check('Черновая правка не меняет опубликованную цену', (await current()).services[0].price.amount === 4500)
  const previewResponse = await snapshot(true, true)
  check('Сотрудник видит черновую цену в предпросмотре', (await previewResponse.json()).services[0].price.amount === 5100)
  check('Предпросмотр закрыт без входа', (await snapshot(true)).status === 401)
  const incomplete = await payload.create({ collection: 'specialists', data: { _status: 'draft' }, draft: true, ...write })
  const incompletePreview = await (await snapshot(true, true)).json()
  check('Незаполненная карточка не ломает предпросмотр', incompletePreview.doctors.find((d: any) => d.id === incomplete.key).name === 'Новый специалист')
  await payload.update({ collection: 'prices', id: price.id, data: { amount: 5100, _status: 'published' }, ...write })
  check('Публикация обновляет общую цену', (await current()).services[0].price.amount === 5100)
  check('В истории фиксируется сотрудник, выполнивший изменение', (await payload.findByID({ collection: 'prices', id: price.id, ...write })).editedBy === 'Тестовый редактор')
  await denied('Услуга без позиции прайса не публикуется', () => payload.create({ collection: 'services', data: { title: 'Без цены', description: 'Описание', direction: direction.id, _status: 'published' }, ...write }))
  await denied('Отрицательная цена не публикуется', () => payload.update({ collection: 'prices', id: price.id, data: { amount: -1, _status: 'published' }, ...write }))
  await denied('Смена постоянного адреса блокируется', () => payload.update({ collection: 'services', where: { key: { equals: 'test-service' } }, data: { key: 'new-key' }, ...write }).then(result => { if (result.errors.length) throw new Error('blocked') }))

  const draft = await payload.create({ collection: 'news', data: { title: 'Секретный черновик', publishedAt: new Date().toISOString(), _status: 'draft' }, draft: true, ...write })
  check('Адрес новости создаётся автоматически', /^[a-z0-9-]+$/.test(draft.key))
  check('Черновик отсутствует в публичном снимке', !(await current()).news.some((n: any) => n.id === draft.key))
  await denied('Прямой доступ к черновику закрыт', () => payload.findByID({ collection: 'news', id: draft.id, overrideAccess: false }))
  await denied('История версий закрыта без входа', () => payload.findVersions({ collection: 'news', overrideAccess: false }))
  await payload.update({ collection: 'news', id: draft.id, data: { _status: 'published' }, ...write })
  check('Редактор публикует самостоятельно', (await current()).news.some((n: any) => n.id === draft.key))

  for (const [key, start, end] of [['active', -10000, 100000], ['expired', -20000, -10000], ['future', 100000, 200000]] as const) await payload.create({ collection: 'promotions', data: { key, title: key, conditions: 'Тестовые условия', startsAt: new Date(Date.now() + start).toISOString(), endsAt: new Date(Date.now() + end).toISOString(), _status: 'published' }, ...write })
  const offers = (await current()).promotions
  check('Действующая акция активна', offers.find((p: any) => p.id === 'active').active)
  check('Просроченная акция сохраняет страницу с завершённым статусом', offers.find((p: any) => p.id === 'expired').active === false)
  check('Будущая акция не раскрывается посетителям', !offers.some((p: any) => p.id === 'future'))
  await denied('Перепутанные даты акции блокируются', () => payload.create({ collection: 'promotions', data: { key: 'wrong-dates', title: 'Неверные даты', conditions: 'Условия', startsAt: '2030-01-02', endsAt: '2030-01-01', _status: 'published' }, ...write }))

  await payload.update({ collection: 'specialists', id: doctor.id, data: { _status: 'draft' }, ...write })
  const afterHide = await current()
  check('Скрытие врача убирает его и связи из публичного сайта', afterHide.doctors.length === 0 && afterHide.services[0].doctorIds.length === 0)
  await denied('Редактор не может удалить связанную услугу', () => payload.delete({ collection: 'services', where: { key: { equals: 'test-service' } }, ...write }).then(r => { if (r.errors.length) throw new Error('blocked') }))

  const versions = await payload.findVersions({ collection: 'prices', where: { parent: { equals: price.id } }, sort: 'createdAt', ...write })
  const original = versions.docs.find(v => v.version.amount === 4500 && v.version._status === 'published')!
  await payload.restoreVersion({ collection: 'prices', id: original.id, ...write })
  check('История позволяет восстановить прежнюю цену', (await current()).services[0].price.amount === 4500)
  await payload.updateGlobal({ slug: 'clinic', data: { name: 'Клиника', phone: '+7 123 456-78-90', address: 'Адрес', hours: 'Пн–пт', _status: 'published' }, ...write })
  await payload.updateGlobal({ slug: 'clinic', data: { phone: '+7 999 000-00-00', _status: 'draft' }, draft: true, ...write })
  check('Черновик контактов не подменяет опубликованный телефон', (await current()).clinic.phone === '+7 123 456-78-90')
  const json = JSON.stringify(await current())
  check('Публичный контракт не раскрывает учётные записи', !json.includes('admin@test.local') && !json.includes('editor@test.local') && !json.includes('hash'))
  const fileA = path.resolve('public/documents/pologenie-o-med-uslugah.pdf')
  const fileB = path.resolve('public/documents/prava-i-obazonosti-2021.pdf')
  const document = await payload.create({ collection: 'documents', filePath: fileA, data: { key: 'test-document', title: 'Документ', _status: 'published' }, ...write })
  const firstFilename = document.filename
  const docRequest = async () => {
    const req = await createLocalReq({}, payload)
    req.routeParams = { key: 'test-document' }
    return currentDocument(req)
  }
  check('Опубликованный файл доступен по постоянной ссылке', Buffer.from(await (await docRequest()).arrayBuffer()).equals(fs.readFileSync(fileA)))
  await payload.update({ collection: 'documents', id: document.id, filePath: fileB, data: { title: 'Документ, новая версия', _status: 'published' }, ...write })
  check('Замена файла обновляет ту же постоянную ссылку', Buffer.from(await (await docRequest()).arrayBuffer()).equals(fs.readFileSync(fileB)))
  const fileVersions = await payload.findVersions({ collection: 'documents', where: { parent: { equals: document.id } }, ...write })
  await payload.restoreVersion({ collection: 'documents', id: fileVersions.docs.find(v => v.version.filename === firstFilename)!.id, ...write })
  check('Откат документа восстанавливает сами PDF-байты', Buffer.from(await (await docRequest()).arrayBuffer()).equals(fs.readFileSync(fileA)))
  await payload.update({ collection: 'documents', id: document.id, data: { _status: 'draft' }, ...write })
  check('Снятый документ не доступен по постоянной ссылке', (await docRequest()).status === 404)
  const oldFileReq = await createLocalReq({}, payload)
  oldFileReq.routeParams = { filename: firstFilename }
  check('Снятый документ закрыт и по прямому адресу файла', (await documentFile(oldFileReq)).status === 404)
  await denied('Последнего администратора нельзя лишить прав', () => payload.update({ collection: 'users', id: admin.id, data: { role: 'editor' }, overrideAccess: false, user: adminUser }))
  console.log(`\nПроверок пройдено: ${checks}. Использована отдельная временная база.`)
} finally {
  await payload.destroy()
  fs.rmSync(directory, { recursive: true, force: true })
}
