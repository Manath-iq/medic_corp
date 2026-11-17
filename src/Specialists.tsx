import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock, MapPin, Phone } from '@phosphor-icons/react'
import { asset, clinic, prices, rubles, specialists as specialistProfiles } from './data'
import SiteHeader from './SiteHeader'
import Footer from './Footer'
import { specialistHref, specialistsHref } from './specialist-links'
import catalog from './specialists.json'

const home = import.meta.env.BASE_URL
const filters = [{ id: '', label: 'Все специалисты' }, ...catalog.directions]
type Filter = typeof filters[number]
const initialDirection = new URLSearchParams(window.location.search).get('direction')
const initialFilter = filters.find(item => item.id === initialDirection) ?? filters[0]
const directoryHref = specialistsHref + (initialFilter.id ? `?direction=${initialFilter.id}` : '')
const prodoctorov = 'https://prodoctorov.ru/kazan/lpu/39363-ksm/otzivi/'
type Doctor = typeof specialistProfiles[number]

function DoctorCard({ doctor, href }: { doctor: Doctor; href: string }) {
  return <article className="team-card">
    <div className="team-portrait">
      <img src={asset(doctor.image)} alt="" width="450" height="675" />
    </div>
    <div className="team-card-copy">
      <span className="team-tag">{catalog.directions.find(item => item.id === doctor.direction)?.label}</span>
      <h2>{doctor.name}<span>{doctor.given}</span></h2>
      <p>{doctor.role}</p>
      <div className="team-card-actions">
        <a className="team-card-link" href={href} aria-label={`Профиль: ${doctor.name} ${doctor.given}`}>О специалисте <ArrowUpRight aria-hidden="true" /></a>
        <a className="team-card-book" href={href + '#appointment'} aria-label={`Запись: ${doctor.name} ${doctor.given}`}>К записи <ArrowRight aria-hidden="true" /></a>
      </div>
    </div>
  </article>
}

function Directory() {
  const [filter, setFilter] = useState(initialFilter)
  const visible = specialistProfiles.filter(doctor => !filter.id || doctor.direction === filter.id)

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
      <div className="team-directory-end"><a className="text-link" href="https://ksm-eko.ru/index.php/home/specialisty">Полный список сотрудников на сайте КСМ <ArrowUpRight /></a><a className="text-link" href={prodoctorov}>Отзывы о клинике на ПроДокторов <ArrowUpRight /></a></div>
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
  const direction = catalog.directions.find(item => item.id === doctor.direction)
  const VisitList = direction?.ordered ? 'ol' : 'ul'
  const services = prices.filter(service => service.category === direction?.label)
  return <>
    <section className="team-profile">
      <figure className="team-profile-photo"><img src={asset(doctor.image)} alt={`${doctor.name} ${doctor.given}`} width="450" height="675" /></figure>
      <div className="team-profile-copy">
        <span className="team-tag">{direction?.label}</span>
        <h1>{doctor.name}<span>{doctor.given}</span></h1>
        <p className="team-role">{doctor.role}</p>
        {doctor.showDetail && <p>{doctor.detail}</p>}
        <div className="team-profile-actions"><a className="button team-primary" href="#appointment">Запись к специалисту <ArrowRight /></a><a className="text-link" href="#credentials">Квалификация <ArrowRight /></a></div>
      </div>
    </section>
    <div className="team-profile-grid">
      <aside ref={appointment} id="appointment" tabIndex={-1} className="team-appointment" aria-labelledby="appointment-title">
        <h2 id="appointment-title">Запись на приём</h2>
        <p>Назовите имя специалиста администратору. Он подскажет доступное время и стоимость визита.</p>
        <dl><div><dt><Clock aria-hidden="true" /> График специалиста</dt><dd>{doctor.schedule ?? 'Уточните в регистратуре'}</dd></div>
          <div><dt><MapPin aria-hidden="true" /> Адрес клиники</dt><dd>{clinic.address}</dd></div></dl>
        <a className="button team-call" href={clinic.phoneHref}><Phone /> {clinic.phone}</a>
        <a className="team-directions" href={home + '#location'}>Как добраться <ArrowUpRight /></a>
      </aside>
      <div className="team-details">
        <section className="team-panel">
          <h2>С чем можно обратиться</h2>
          <ul className="team-topics">{doctor.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
        </section>
        <section className="team-panel">
          <h2>Приёмы по направлению</h2>
          <p>Стоимость по прайсу клиники. Возможность записи на конкретную услугу уточните в регистратуре.</p>
          <ul className="team-prices">{services.map(service => <li key={service.name}><div><strong>{service.name}</strong><span>{service.note}</span></div><b>{rubles(service.amount)}</b></li>)}</ul>
          <a className="text-link" href={clinic.pricesUrl}>Полный прайс КСМ <ArrowUpRight /></a>
        </section>
        {direction && <section className="team-panel team-visit">
          <h2>{direction.title}</h2>
          <VisitList className={direction.ordered ? undefined : 'team-topics'}>{direction.items.map(item => <li key={item}>{item}</li>)}</VisitList>
          <div className="team-visit-links">{direction.links.map(link => <a key={link.url} className="text-link" href={link.url}>{link.label} <ArrowUpRight /></a>)}</div>
        </section>}
        <section className="team-panel" id="credentials">
          <h2>Образование и квалификация</h2>
          {doctor.education.length ? <ul className="team-credentials">{doctor.education.map(item => <li key={item}>{item}</li>)}</ul> : <p>Сведения уточняются у клиники.</p>}
          <h3>Аккредитация и допуск к работе</h3>
          {doctor.accreditation.length ? <ul className="team-credentials">{doctor.accreditation.map(item => <li key={item}>{item}</li>)}</ul> : <p>Сведения уточняются у клиники.</p>}
          <a className="text-link" href={doctor.url}>Источник на сайте КСМ <ArrowUpRight /></a>
        </section>
      </div>
    </div>
    <div className="team-directory-end"><a className="text-link" href={directoryHref}><ArrowLeft /> Все специалисты</a><a className="text-link" href={prodoctorov}>Отзывы о клинике на ПроДокторов <ArrowUpRight /></a></div>
  </>
}

export default function Specialists({ doctor }: { doctor?: Doctor }) {
  return <div className="team-page">
    <a className="skip-link" href="#team-main">Перейти к содержимому</a>
    <SiteHeader home={home} />
    <main className="team-shell" id="team-main">
      <a className="team-back" href={doctor ? directoryHref : home}><ArrowLeft aria-hidden="true" /> {doctor ? 'Все специалисты' : 'На главную'}</a>
      {doctor ? <Profile doctor={doctor} /> : <Directory />}
    </main>
    <Footer />
  </div>
}
