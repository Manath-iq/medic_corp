import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve('cms/data/clinic.db')
if (!fs.existsSync(source)) throw new Error('Локальная база ещё не создана. Запустите npm run local.')
const directory = path.resolve('cms/data/backups', new Date().toISOString().replace(/[:.]/g, '-'))
fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
const target = path.join(directory, 'clinic.db')
const db = new DatabaseSync(source, { readOnly: true })
try { db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`) } finally { db.close() }
if (fs.existsSync('cms/uploads')) fs.cpSync('cms/uploads', path.join(directory, 'uploads'), { recursive: true })
if (fs.existsSync('cms/data/document-history')) fs.cpSync('cms/data/document-history', path.join(directory, 'document-history'), { recursive: true })
const verification = new DatabaseSync(target, { readOnly: true })
try {
  const result = verification.prepare('PRAGMA integrity_check').get()
  if (result.integrity_check !== 'ok') throw new Error('Проверка резервной базы не пройдена')
} finally { verification.close() }
fs.writeFileSync(path.join(directory, 'README.txt'), 'Локальная резервная копия КСМ. Для восстановления остановите оба сервера, сохраните текущие data/clinic.db, data/document-history и uploads, замените их файлами из этой папки и запустите npm run local. cms/.env.local хранится отдельно. Создавайте копию в период, когда сотрудники не загружают новые файлы.\n')
console.log(`Резервная копия и проверка SQLite готовы: ${directory}`)
