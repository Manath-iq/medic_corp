import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import { asset, clinic } from './data'

const home = import.meta.env.BASE_URL

export default function Footer() {
  return <footer id="footer" className="footer">
    <div className="container">
      <a className="footer-home" href={home + '#main'} aria-label="Клиника семейной медицины, на главную">
        <img src={asset('logo-small.webp')} width="52" height="52" alt="" />
        <span>Клиника<br />семейной медицины</span>
      </a>
      <div className="footer-directory">
        <div className="footer-contacts">
          <h2>Регистратура</h2>
          <a className="footer-phone" href={clinic.phoneHref}>
            {clinic.phone}
          </a>
          <a className="text-link" href={home + '#location'}>{clinic.address} <ArrowUpRight /></a>
        </div>
        <nav className="footer-patient-links" aria-label="Информация пациентам">
          <h2>Пациентам</h2>
          <a href={clinic.informationUrl} target="_blank" rel="noreferrer">Сведения и лицензия <ArrowUpRight /></a>
          <a href={clinic.patientUrl} target="_blank" rel="noreferrer">Информация для потребителя <ArrowUpRight /></a>
          <a href={clinic.preparationUrl} target="_blank" rel="noreferrer">Подготовка к исследованиям <ArrowUpRight /></a>
          <a href={home + '#faq'}>Вопросы и ответы <ArrowUpRight /></a>
          <a href={clinic.website} target="_blank" rel="noreferrer">ksm-eko.ru <ArrowRight /></a>
        </nav>
      </div>
      <div className="footer-bottom">
        <p>Имеются противопоказания.<br />Необходима консультация специалиста.</p>
        <span>КСМ · 2026</span>
      </div>
    </div>
  </footer>
}
