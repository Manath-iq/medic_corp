import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import './styles.css'
import './specialists.css'
import Specialists from './Specialists'
import { specialists } from './data'

const id = new URLSearchParams(window.location.search).get('doctor')
const doctor = specialists.find(item => item.id === id)
if (id && !doctor) document.title = 'Специалист не найден | КСМ'
if (doctor) document.title = `${doctor.name} ${doctor.given} | КСМ, Казань`

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Specialists doctor={doctor} missing={Boolean(id && !doctor)} />
  </React.StrictMode>,
)
