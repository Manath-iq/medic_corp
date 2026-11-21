import fs from 'node:fs'
import { randomBytes } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'

async function checkPort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', () => reject(new Error(`Порт ${port} занят. Остановите предыдущий локальный сервер.`)))
    server.listen(port, '127.0.0.1', () => server.close(resolve))
  })
}
await Promise.all([4173, 3001].map(checkPort))
const envFile = 'cms/.env.local'
if (!fs.existsSync(envFile)) {
  fs.writeFileSync(envFile, `PAYLOAD_SECRET=${randomBytes(48).toString('hex')}\nCMS_URL=http://localhost:3001\nSITE_URL=http://localhost:4173/medic_corp\nSEED_ADMIN_USERNAME=admin\nSEED_ADMIN_PASSWORD=${randomBytes(15).toString('base64url')}\n`, { mode: 0o600 })
}
process.loadEnvFile(envFile)
if (!process.env.SEED_ADMIN_USERNAME) {
  fs.appendFileSync(envFile, '\nSEED_ADMIN_USERNAME=admin\n')
  process.env.SEED_ADMIN_USERNAME = 'admin'
}
await import('./migrate-usernames.mjs')
for (const args of [['run', 'cms:importmap'], ['run', 'cms:seed']]) {
  const result = spawnSync('npm', args, { stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status || 1)
}
console.log(`\nСайт: http://localhost:4173/medic_corp/\nАдминка: http://localhost:3001/admin\nЛогин: ${process.env.SEED_ADMIN_USERNAME}\nЛокальный пароль находится в cms/.env.local (SEED_ADMIN_PASSWORD).\n`)
const children = [
  spawn('npm', ['run', 'cms'], { stdio: 'inherit', env: process.env }),
  spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], { stdio: 'inherit', env: { ...process.env, VITE_CMS_URL: process.env.CMS_URL } }),
]
let stopping = false
function stop(code = 0) { if (stopping) return; stopping = true; children.forEach(child => child.kill('SIGTERM')); process.exitCode = code }
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
children.forEach(child => child.on('exit', code => stop(code || 0)))
