import { ArrowUpRight } from '@phosphor-icons/react'
import { asset, getClinic } from './data'

const home = import.meta.env.BASE_URL

export default function Footer() {
  const clinic = getClinic()
  return <footer id="footer" className="footer">
    <div className="container">
      <a className="footer-home" href={home + '#main'} aria-label="Клиника семейной медицины, на главную">
        <img src={asset('logo-small.webp')} width="52" height="52" alt="" />
        <span>{clinic.name}</span>
      </a>
      <div className="footer-directory">
        <div className="footer-contacts">
          <h2>Регистратура</h2>
          <a className="footer-phone" href={clinic.phoneHref}>
            {clinic.phone}
          </a>
          <a className="text-link" href={clinic.contactsUrl}>{clinic.address} <ArrowUpRight /></a>
        </div>
        <nav className="footer-patient-links" aria-label="Информация пациентам">
          <h2>Пациентам</h2>
          <a href={clinic.informationUrl}>Сведения и лицензия <ArrowUpRight /></a>
          <a href={clinic.patientUrl}>Первый приём и документы <ArrowUpRight /></a>
          <a href={clinic.preparationUrl}>Подготовка к исследованиям <ArrowUpRight /></a>
          <a href={clinic.omsUrl}>ЭКО по ОМС <ArrowUpRight /></a>
          <a href={home + '#faq'}>Вопросы и ответы <ArrowUpRight /></a>
          <a href={clinic.contactsUrl}>Контакты клиники <ArrowUpRight /></a>
        </nav>
      </div>
      <div className="footer-bottom">
        <p>{clinic.warning}</p>
        <span>КСМ · {new Date().getFullYear()}</span>
      </div>
    </div>
  </footer>
}
