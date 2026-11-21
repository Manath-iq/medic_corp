import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import './styles.css'
import './services.css'
import { boot } from './content'

void boot(async () => {
  const { default: Services } = await import('./Services')
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Services /></React.StrictMode>)
})
