export const specialistsHref = import.meta.env.BASE_URL + 'specialists/'

export function specialistHref(id: string, direction = '') {
  const params = new URLSearchParams({ doctor: id })
  if (direction) params.set('direction', direction)
  return specialistsHref + '?' + params.toString()
}
