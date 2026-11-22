import { createRoot, hydrateRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

function Ready({ children }: { children: ReactNode }) {
  useEffect(() => { document.documentElement.dataset.clientReady = 'true' }, [])
  return children
}

export function mount(node: ReactNode) {
  const root = document.getElementById('root')!
  const tree = <Ready>{node}</Ready>
  if (root.dataset.ssr === 'true') hydrateRoot(root, tree)
  else createRoot(root).render(tree)
}
