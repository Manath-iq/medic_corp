import catalog from './services.json'

export type Service = {
  id: string
  categoryId: string
  title: string
  summary: string
  price: { amount: number | null; currency: string; kind: string; note: string }
  sourceCode: string
  description: string
  includes: string[]
  preparation: string
  doctorIds: string[]
  sourceUrl: string
  verifiedAt: string
  contentStatus: string
}
export const services: Service[] = catalog.services
export const serviceCategories = catalog.categories
