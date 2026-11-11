import { asset } from './data'

// The image session only writes files. The next build picks them up automatically.
// Until then, every slot resolves to an existing clinic image: no broken placeholders.
const generated = import.meta.glob<string>('./assets/generated/*.{webp,png,jpg,avif}', {
  eager: true, query: '?url', import: 'default',
})

const slots = {
  hero: ['hero-lab', 'embryology.webp'],
  reproduction: ['direction-reproduction', 'genetics.webp'],
  gynecology: ['direction-gynecology', 'kapitskaya.webp'],
  diagnostics: ['direction-diagnostics', 'diagnostics.webp'],
  embryology: ['direction-embryology', 'embryology.webp'],
  genetics: ['direction-genetics', 'andrology.webp'],
  andrology: ['direction-andrology', 'solovev.webp'],
  oms: ['oms-first-step', 'genetics.webp'],
} as const

export type MediaSlot = keyof typeof slots

export function media(slot: MediaSlot) {
  const [name, fallback] = slots[slot]
  for (const extension of ['webp', 'png', 'jpg', 'avif']) {
    const image = generated[`./assets/generated/${name}.${extension}`]
    if (image) return { src: image, generated: true }
  }
  return { src: asset(fallback), generated: false }
}
