import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

const root = () => process.env.CMS_STORAGE_ROOT || path.dirname(fileURLToPath(import.meta.url))
const safeName = (filename: unknown): filename is string => typeof filename === 'string' && filename === path.basename(filename) && !filename.startsWith('.') && !filename.includes('\\') && /\.(pdf|jpe?g|png|webp)$/i.test(filename)

export async function preserveDocument(filename: unknown) {
  if (!safeName(filename)) return
  const archive = path.resolve(root(), 'data/document-history')
  await fs.mkdir(archive, { recursive: true })
  try { await fs.access(path.join(archive, filename)); return } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  const source = path.resolve(root(), 'uploads/documents', filename)
  try { await fs.copyFile(source, path.join(archive, filename), fs.constants.COPYFILE_EXCL) }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error }
}

export const retainDocumentFile: CollectionAfterChangeHook = async ({ doc }) => {
  // Immutable binary copies accompany Payload's metadata versions. Payload may
  // remove its old upload on replacement; restoration still has the old bytes.
  if (doc.filename) await preserveDocument(doc.filename)
  return doc
}

export async function documentFile(req: PayloadRequest) {
  const filename = req.routeParams?.filename
  if (!safeName(filename)) return new Response('Not found', { status: 404 })
  if (!req.user) {
    const visible = await req.payload.find({ collection: 'documents', where: { and: [{ filename: { equals: filename } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 0, req, overrideAccess: false })
    if (!visible.totalDocs) return new Response('Not found', { status: 404 })
  }
  try {
    const archive = path.resolve(root(), 'data/document-history', filename)
    const current = path.resolve(root(), 'uploads/documents', filename)
    const bytes = await fs.readFile(archive).catch(error => { if (error.code === 'ENOENT') return fs.readFile(current); throw error })
    const ext = path.extname(filename).toLowerCase()
    const type = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    return new Response(bytes, { headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`, 'Cache-Control': 'private, no-store' } })
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Response('Not found', { status: 404 }); throw error }
}

export async function currentDocument(req: PayloadRequest) {
  const key = req.routeParams?.key
  if (typeof key !== 'string' || !/^[a-z0-9-]+$/.test(key)) return new Response('Not found', { status: 404 })
  const result = await req.payload.find({ collection: 'documents', where: { and: [{ key: { equals: key } }, { _status: { equals: 'published' } }] }, limit: 1, req, overrideAccess: false, depth: 0 })
  if (!result.docs[0]) return new Response('Not found', { status: 404 })
  req.routeParams = { ...req.routeParams, filename: result.docs[0].filename }
  return documentFile(req)
}
