import React from 'react'
import { mount } from './mount'
import '@fontsource-variable/manrope'
import './styles.css'
import './services.css'
import { boot } from './content'

void boot(async () => {
  const { default: Services } = await import('./Services')
  mount(<React.StrictMode><Services /></React.StrictMode>)
})
