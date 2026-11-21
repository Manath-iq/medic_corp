import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock, MapPin, Phone } from '@phosphor-icons/react'
import { asset, clinic, specialists as specialistProfiles } from './data'
import { services as serviceCatalog, priceLabel } from './services-data'
import { serviceHref } from './services-links'
import { siteContent, safeHref } from './content'
import SiteHeader from './SiteHeader'
import Footer from './Footer'
import { specialistHref, specialistsHref } from './specialist-links'
import catalog from './specialists.json'

const home = import.meta.env.BASE_URL
const availableDirections = siteContent()?.directions ?? catalog.directions
const filters = [{ id: '', label: 'Все специалисты' }, ...availableDirections.filter(d => specialistProfiles.some(s => s.directions.includes(d.id)))]
type Filter = typeof filters[number]
const initialDirection = new URLSearchParams(window.location.search).get('direction')
const initialFilter = filters.find(item => item.id === initialDirection) ?? filters[0]
const directoryHref = specialistsHref + (initialFilter.id ? `?direction=${initialFilter.id}` : '')
const prodoctorov = safeHref(siteContent()?.clinic.prodoctorovUrl || 'https://prodoctorov.ru/kazan/lpu/39363-ksm/otzivi/')
type Doctor = typeof specialistProfiles[number]

function DoctorCard({ doctor, href }: { doctor: Doctor; href: string }) {
  return <article className="team-card">
    <div className="team-portrait">
      {doctor.image ? <img src={asset(doctor.image)} alt="" width="450" height="675" /> : <span className="doctor-placeholder">{doctor.name[0]}{doctor.given[0]}</span>}
    </div>
    <div className="team-card-copy">
      <span className="team-tag">{availableDirections.find(item => item.id === doctor.direction)?.label}</span>
      <h2>{doctor.name}<span>{doctor.given}</span></h2>
      <p>{doctor.role}</p>
      <div className="team-card-actions">
        <a className="team-card-link" href={href} aria-label={`Профиль: ${doctor.name} ${doctor.given}`}>О специалисте <ArrowUpRight aria-hidden="true" /></a>
        {doctor.available && <a className="team-card-book" href={href + '#appointment'} aria-label={`Запись: ${doctor.name} ${doctor.given}`}>К записи <ArrowRight aria-hidden="true" /></a>}
      </div>
    </div>
  </article>
}

function Directory() {
  const [filter, setFilter] = useState(initialFilter)
  const visible = specialistProfiles.filter(doctor => !filter.id || doctor.directions.includes(filter.id))

  function changeFilter(next: Filter) {
    const url = new URL(window.location.href)
    if (next.id) url.searchParams.set('direction', next.id)
    else url.searchParams.delete('direction')
    window.history.replaceState(window.history.state, '', url)
    setFilter(next)
  }
  return <>
    <section className="team-intro">
      <h1>Специалисты клиники</h1>
    </section>
    <section aria-label="Каталог специалистов">
      <div className="team-toolbar">
        <div className="team-filters" role="group" aria-label="Направление">{filters.map(item => <button key={item.id} type="button" aria-pressed={filter === item} onClick={() => changeFilter(item)}>{item.label}</button>)}</div>
        <span role="status">Найдено: {visible.length}</span>
      </div>
      <div className="team-grid">{visible.map(doctor => <DoctorCard doctor={doctor} href={specialistHref(doctor.id, filter.id)} key={doctor.id} />)}</div>
      {!visible.length && <p>Специалистов в этом разделе пока нет. Позвоните в регистратуру, чтобы уточнить приём.</p>}
      <div className="team-directory-end"><a className="text-link" href={clinic.informationUrl + '#team'}>Сотрудники клиники <ArrowUpRight /></a><a className="text-link" href={prodoctorov}>Отзывы о клинике на ПроДокторов <ArrowUpRight /></a></div>
    </section>
  </>
}

function Profile({ doctor }: { doctor: Doctor }) {
  const appointment = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (window.location.hash !== '#appointment') return
    appointment.current?.scrollIntoView({ behavior: 'instant' })
    appointment.current?.focus({ preventScroll: true })
  }, [])
  const direction = availableDirections.find(item => item.id === doctor.direction)
  const services = serviceCatalog.filter(service => service.doctorIds.includes(doctor.id)).map(service => {
    const prices = service.priceItems?.filter(p => !p.specialistId || p.specialistId === doctor.id)
    return { ...service, price: prices?.find(p => p.specialistId === doctor.id) || prices?.[0] || service.price }
  })
  return <>
    <section className="team-profile">
      <figure className="team-profile-photo">{doctor.image ? <img src={asset(doctor.image)} alt={`${doctor.name} ${doctor.given}`} width="450" height="675" /> : <span className="doctor-placeholder">{doctor.name[0]}{doctor.given[0]}</span>}</figure>
      <div className="team-profile-copy">
        <span className="team-tag">{direction?.label}</span>
        <h1>{doctor.name}<span>{doctor.given}</span></h1>
        <p className="team-role">{doctor.role}</p>
        {doctor.showDetail && <p>{doctor.detail}</p>}
        <div className="team-profile-actions"><a className="button team-primary" href="#appointment">Запись к специалисту <ArrowRight /></a><a className="text-link" href="#credentials">Квалификация <ArrowRight /></a></div>
      </div>
    </section>
    <div className="team-profile-grid">
      <div className="team-details">
        <section className="team-panel">
          <h2>С чем можно обратиться</h2>
          <ul className="team-topics">{doctor.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
        </section>
        <section className="team-panel" id="credentials">
          <h2>Образование и квалификация</h2>
          {doctor.education.length ? <ul className="team-credentials">{doctor.education.map(item => <li key={item}>{item}</li>)}</ul> : <p>Сведения уточняются у клиники.</p>}
          <h3>Аккредитация и допуск к работе</h3>
          {doctor.accreditation.length ? <ul className="team-credentials">{doctor.accreditation.map(item => <li key={item}>{item}</li>)}</ul> : <p>Сведения уточняются у клиники.</p>}
        </section>
        <section className="team-panel">
          <h2>Цена по направлениям</h2>
          <p>Стоимость по прайсу клиники. Возможность записи на конкретную услугу уточните в регистратуре.</p>
          <ul className="team-prices">{services.map(service => <li key={service.id}><div><strong><a href={serviceHref(service.id)}>{service.title}</a></strong><span>{service.summary}</span></div><b>{priceLabel(service)}</b></li>)}</ul>
          <a className="text-link" href={clinic.priceListUrl}>Цены по направлениям <ArrowUpRight /></a>
        </section>
      </div>
      <aside ref={appointment} id="appointment" tabIndex={-1} className="team-appointment" aria-labelledby="appointment-title">
        <h2 id="appointment-title">Запись на приём</h2>
        <p>{doctor.available ? 'Назовите имя специалиста администратору. Он подскажет доступное время и стоимость визита.' : 'Сейчас специалист не ведёт приём. Регистратура поможет выбрать другого врача.'}</p>
        <dl><div><dt><Clock aria-hidden="true" /> График специалиста</dt><dd>{doctor.schedule ?? 'Уточните в регистратуре'}</dd></div>
          <div><dt><MapPin aria-hidden="true" /> Адрес клиники</dt><dd>{clinic.address}</dd></div></dl>
        <a className="button team-call" href={clinic.phoneHref}><Phone /> {clinic.phone}</a>
        <a className="team-directions" href={home + '#location'}>Как добраться <ArrowUpRight /></a>
      </aside>
    </div>
    <div className="team-directory-end"><a className="text-link" href={directoryHref}><ArrowLeft /> Все специалисты</a><a className="text-link" href={prodoctorov}>Отзывы о клинике на ПроДокторов <ArrowUpRight /></a></div>
  </>
}

export default function Specialists({ doctor, missing = false }: { doctor?: Doctor; missing?: boolean }) {
  return <div className="team-page">
    <a className="skip-link" href="#team-main">Перейти к содержимому</a>
    <SiteHeader home={home} />
    <main className="team-shell" id="team-main">
      <a className="team-back" href={doctor || missing ? directoryHref : home}><ArrowLeft aria-hidden="true" /> {doctor || missing ? 'Все специалисты' : 'На главную'}</a>
      {missing ? <section className="team-intro"><h1>Специалист не найден</h1><p className="team-missing-note">Выберите специалиста в каталоге клиники.</p><a className="button team-call" href={specialistsHref}>Все специалисты</a></section> : doctor ? <Profile doctor={doctor} /> : <Directory />}
    </main>
    <Footer />
  </div>
}
