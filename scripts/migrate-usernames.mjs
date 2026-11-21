import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('cms/data/clinic.db')
if (fs.existsSync(file)) {
  const db = new DatabaseSync(file)
  try {
    const columns = db.prepare('PRAGMA table_info(users)').all()
    if (columns.length && !columns.some(c => c.name === 'username')) {
      const backups = path.resolve('cms/data/backups')
      fs.mkdirSync(backups, { recursive: true })
      const backup = path.join(backups, `before-usernames-${Date.now()}.db`)
      db.exec(`VACUUM INTO '${backup.replaceAll("'", "''")}'`)
      db.exec('PRAGMA foreign_keys = OFF')
      db.exec('BEGIN IMMEDIATE')
      try {
        db.exec('ALTER TABLE users ADD COLUMN username TEXT')
        const users = db.prepare('SELECT id, email FROM users ORDER BY id').all()
        const update = db.prepare('UPDATE users SET username = ? WHERE id = ?')
        for (const user of users) {
          const username = user.email === (process.env.SEED_ADMIN_EMAIL || 'admin@clinic.local') ? (process.env.SEED_ADMIN_USERNAME || 'admin') : `employee-${user.id}`
          update.run(username.toLowerCase(), user.id)
          console.log(`Учётная запись ${user.id}: логин ${username}. Пароль сохранён.`)
        }
        db.exec('CREATE UNIQUE INDEX users_username_idx ON users(username)')
        // Finish the schema transition ourselves. Rebuilding a table with a new
        // required column through a dev schema push can recreate indexes twice.
        const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get().sql
        const indexes = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'users' AND sql IS NOT NULL").all()
        const rebuilt = table.replace(/^CREATE TABLE\s+["`]?users["`]?/i, 'CREATE TABLE __username_users')
          .replace(/(["`]?email["`]?\s+text)\s+NOT NULL/i, '$1')
          .replace(/(["`]?username["`]?\s+text)(?!\s+NOT NULL)/i, '$1 NOT NULL')
        db.exec(rebuilt)
        const names = db.prepare('PRAGMA table_info(users)').all().map(c => `"${c.name}"`).join(',')
        db.exec(`INSERT INTO __username_users (${names}) SELECT ${names} FROM users`)
        db.exec('DROP TABLE users')
        db.exec('ALTER TABLE __username_users RENAME TO users')
        for (const index of indexes) db.exec(index.sql)
        db.exec('COMMIT')
      } catch (error) { db.exec('ROLLBACK'); throw error }
      finally { db.exec('PRAGMA foreign_keys = ON') }
    }
  } finally { db.close() }
}
