import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import './styles.css'
import './specialists.css'
import Specialists from './Specialists'
import { specialists } from './data'
import { specialistsHref } from './specialist-links'

const id = new URLSearchParams(window.location.search).get('doctor')
const doctor = specialists.find(item => item.id === id)
if (doctor) document.title = `${doctor.name} ${doctor.given} | КСМ, Казань`

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {id && !doctor ? <main className="container section"><h1>Специалист не найден</h1><a className="text-link" href={specialistsHref}>Все специалисты</a></main> : <Specialists doctor={doctor} />}
  </React.StrictMode>,
)
