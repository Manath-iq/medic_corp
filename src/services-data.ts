import { rubles } from './data'
import catalog from './services.json'
import { siteContent } from './content'

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
  showOnHome?: boolean
  priceItems?: { id: string; title: string; amount: number | null; currency: string; kind: string; note: string; variant: string; sourceCode: string; specialistId: string }[]
  seoTitle?: string
  seoDescription?: string
}
export const services: Service[] = catalog.services
export const getServices = (): Service[] => siteContent()?.services ?? services
export const getServiceCategories = () => siteContent()?.directions.map(d => ({ id: d.id, title: d.title, description: d.description })) ?? catalog.categories

export const priceLabel = (service: Pick<Service, 'price'>) => service.price.kind === 'oms' ? 'По программе ОМС' : service.price.amount === null ? 'Уточнить стоимость' : `${service.price.kind === 'from' ? 'от ' : ''}${rubles(service.price.amount)}`
