import React from 'react'
import { mount } from './mount'
import '@fontsource-variable/manrope'
import { boot } from './content'
import './styles.css'
import './public-content.css'

void boot(async () => {
  const { default: App } = await import('./App')
  mount(<React.StrictMode><App /></React.StrictMode>)
})
