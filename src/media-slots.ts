// Shared by runtime image selection and Vite's HTML preload generation.
export const mediaExtensions = ['webp', 'png', 'jpg', 'avif'] as const

export const mediaSlots = {
  hero: ['hero-lab', 'embryology.webp'],
  reproduction: ['direction-reproduction', 'genetics.webp'],
  gynecology: ['direction-gynecology', 'kapitskaya.webp'],
  diagnostics: ['direction-diagnostics', 'diagnostics.webp'],
  embryology: ['direction-embryology', 'embryology.webp'],
  genetics: ['direction-genetics', 'andrology.webp'],
  andrology: ['direction-andrology', 'solovev.webp'],
  oms: ['oms-first-step', 'genetics.webp'],
} as const
