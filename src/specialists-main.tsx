import React from 'react'
import { mount } from './mount'
import '@fontsource-variable/manrope'
import './styles.css'
import './specialists.css'
import { boot } from './content'

void boot(async () => {
const { default: Specialists } = await import('./Specialists')
const { getSpecialists } = await import('./data')
const id = new URLSearchParams(window.location.search).get('doctor')
const doctor = getSpecialists().find(item => item.id === id)

mount(
  <React.StrictMode>
    <Specialists doctor={doctor} missing={Boolean(id && !doctor)} />
  </React.StrictMode>,
)
})
