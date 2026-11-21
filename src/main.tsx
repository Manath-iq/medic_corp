import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import { boot } from './content'
import './styles.css'

void boot(async () => {
  const { default: App } = await import('./App')
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
})
