import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './styles.css'
import './information.css'
import './public-content.css'
import { boot, cmsEnabled } from './content'

void boot(async () => {
  const { default: Information } = cmsEnabled ? await import('./Information') : ['news', 'pages'].includes(document.getElementById('root')!.dataset.page || '') ? { default: () => <p>Этот раздел доступен в локальной версии с админкой. <a href={import.meta.env.BASE_URL}>На главную</a></p> } : await import('./InformationLegacy')
  createRoot(document.getElementById('root')!).render(<StrictMode><Information /></StrictMode>)
})
