import { asset } from './data'
import { mediaExtensions, mediaSlots } from './media-slots'

// The image session only writes files. The next build picks them up automatically.
// Until then, every slot resolves to an existing clinic image: no broken placeholders.
const generated = import.meta.glob<string>('./assets/generated/*.{webp,png,jpg,avif}', {
  eager: true, query: '?url', import: 'default',
})

export type MediaSlot = keyof typeof mediaSlots

export function media(slot: MediaSlot) {
  const [name, fallback] = mediaSlots[slot]
  for (const extension of mediaExtensions) {
    const image = generated[`./assets/generated/${name}.${extension}`]
    if (image) return { src: image, generated: true }
  }
  return { src: asset(fallback), generated: false }
}
