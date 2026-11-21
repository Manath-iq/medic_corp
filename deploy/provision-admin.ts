import { getPayload } from 'payload'
import config from '../cms/payload.config'

// Run explicitly on the server copy only. Never seed or mutate the local CMS.
if (!process.env.DEMO_ADMIN_PASSWORD) throw new Error('DEMO_ADMIN_PASSWORD is required')
if (process.env.CMS_STORAGE_ROOT !== '/storage') throw new Error('Server storage is required')
const payload = await getPayload({ config })
try {
  const users = await payload.find({ collection: 'users', pagination: false, depth: 0 })
  const admin = users.docs.find(user => user.username === 'admin' && user.role === 'admin')
  if (!admin) throw new Error('Expected existing admin; refusing to modify unknown users')
  await payload.update({ collection: 'users', id: admin.id, data: { password: process.env.DEMO_ADMIN_PASSWORD }, overrideAccess: true })
  console.log('Server administrator password updated; password not logged.')
} finally {
  await payload.destroy()
}
