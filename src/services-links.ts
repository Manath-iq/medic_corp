export const servicesHref = import.meta.env.BASE_URL + 'services/'
export const serviceHref = (id: string, query = '') => {
  const params = new URLSearchParams(query)
  params.set('service', id)
  return servicesHref + '?' + params.toString()
}
export const categoryHref = (id: string) => servicesHref + '?category=' + encodeURIComponent(id)
