import { StrictMode } from 'react'
import { mount } from './mount'
import '@fontsource-variable/manrope'
import './styles.css'
import './information.css'
import './public-content.css'
import { boot, cmsEnabled, siteContent } from './content'

void boot(async () => {
  const { default: Information } = cmsEnabled || siteContent() ? await import('./Information') : ['news', 'pages'].includes(document.getElementById('root')!.dataset.page || '') ? { default: () => <p>Этот раздел доступен в локальной версии с админкой. <a href={import.meta.env.BASE_URL}>На главную</a></p> } : await import('./InformationLegacy')
  mount(<StrictMode><Information /></StrictMode>)
})
