import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, MagnifyingGlass, Phone, X } from '@phosphor-icons/react'
import SiteHeader from './SiteHeader'
import Footer from './Footer'
import { asset, clinic, specialists } from './data'
import { specialistHref } from './specialist-links'
import { priceLabel, serviceCategories, services } from './services-data'
import { categoryHref, serviceHref, servicesHref } from './services-links'
import type { Service } from './services-data'

const home = import.meta.env.BASE_URL
const normalize = (value: string) => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()

function Appointment({ service }: { service: Service }) {
  return <aside className="svc-appointment">
    <span className="svc-small">{service.price.kind === 'oms' ? 'Условия программы' : 'Стоимость услуги'}</span>
    <h2>{priceLabel(service)}</h2>
    <p>{service.price.note}</p>
    <a className="button svc-call" href={clinic.phoneHref}><Phone />Позвонить и записаться</a>
    <a className="svc-phone" href={clinic.phoneHref}>{clinic.phone}</a>
    <div className="svc-address"><span>Клиника семейной медицины</span><a href={clinic.contactsUrl}>{clinic.address} <ArrowUpRight size={16} /></a></div>
  </aside>
}

function Details({ service, back }: { service: Service; back: string }) {
  const category = serviceCategories.find(item => item.id === service.categoryId)!
  const doctors = specialists.filter(doctor => service.doctorIds.includes(doctor.id))
  return <>
    <a className="svc-back" href={back}><ArrowLeft /> Все услуги</a>
    <section className="svc-detail-heading"><span className="svc-tag">{category.title}</span><h1>{service.title}</h1><p>{service.summary}</p></section>
    <div className="svc-detail-layout">
      <div className="svc-detail-content">
        <section className="svc-panel"><h2>Об услуге</h2><p>{service.description}</p><h3>{service.price.amount === null ? 'Что уточнить при обращении' : 'Что входит'}</h3><ul className="svc-includes">{service.includes.map(item => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul><p className="svc-price-note">{service.price.amount === null ? 'Точный состав и условия согласуются с клиникой.' : 'Дополнительные исследования и процедуры не включены, если не указаны в составе услуги.'}</p></section>
        <section id="preparation" className="svc-panel svc-preparation"><h2>Перед визитом</h2><p>{service.preparation}</p><a className="text-link" href={clinic.preparationUrl}>Памятка по подготовке <ArrowUpRight /></a></section>
        {doctors.length > 0 && <section className="svc-doctors"><h2>Специалисты направления</h2><div>{doctors.map(doctor => <a key={doctor.id} href={specialistHref(doctor.id)}><img src={asset(doctor.image)} alt="" width={72} height={88} loading="lazy" /><span><strong>{doctor.name}<br />{doctor.given}</strong><small>{doctor.role}</small></span><ArrowUpRight aria-hidden="true" /></a>)}</div><p>Специалиста и доступное время уточните при записи.</p></section>}
        <div className="svc-source"><span>{service.sourceCode && `Позиция прайса ${service.sourceCode}. `}Стоимость носит справочный характер.</span><a href={categoryHref(category.id) + '#catalog'}>Цены по направлению <ArrowUpRight size={16} /></a></div>
      </div>
      <Appointment service={service} />
    </div>
  </>
}

function Directory() {
  const initial = new URLSearchParams(window.location.search)
  const [category, setCategory] = useState(serviceCategories.some(item => item.id === initial.get('category')) ? initial.get('category')! : 'all')
  const [query, setQuery] = useState(initial.get('q') || '')
  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (query) params.set('q', query)
    window.history.replaceState(null, '', servicesHref + (params.size ? '?' + params.toString() : '') + window.location.hash)
  }, [category, query])
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search)
      setCategory(serviceCategories.some(item => item.id === params.get('category')) ? params.get('category')! : 'all')
      setQuery(params.get('q') || '')
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  useEffect(() => {
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
  }, [])
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const matches = services.filter(service => terms.every(term => normalize([service.title, service.summary, serviceCategories.find(item => item.id === service.categoryId)?.title].join(' ')).includes(term)))
  const visible = matches.filter(service => category === 'all' || service.categoryId === category)
  const groups = serviceCategories.filter(item => visible.some(service => service.categoryId === item.id))
  const selected = serviceCategories.find(item => item.id === category)
  const linkQuery = new URLSearchParams({ ...(category !== 'all' ? { category } : {}), ...(query ? { q: query } : {}) }).toString()
  return <>
    <a className="svc-back" href={home}><ArrowLeft /> На главную</a>
    <section className="svc-hero">
      <div className="svc-hero-copy"><span className="svc-small">Клиника семейной медицины</span><h1>Забота о здоровье.<br />С понятного шага.</h1><p>Консультации, обследования и репродуктивные программы. Найдите услугу и узнайте, что входит в приём.</p><a href="#catalog" className="button svc-call">Выбрать услугу <ArrowRight /></a></div>
      <figure><img src={asset('diagnostics.webp')} alt="Диагностическое оборудование из материалов клиники" width={640} height={480} /><figcaption>Услуги и цены <span>КСМ · Казань</span></figcaption></figure>
    </section>
    <section id="catalog" className="svc-catalog" aria-labelledby="catalog-title">
      <div className="svc-catalog-heading"><h2 id="catalog-title">Услуги и цены</h2><a className="text-link" id="full-list" href={home + 'documents/prais-06-04-26-ksm-v1.pdf'}>Полный прайс (PDF) <ArrowUpRight /></a></div>
      <div className="svc-search"><MagnifyingGlass aria-hidden="true" /><label className="svc-sr" htmlFor="service-search">Поиск услуг</label><input id="service-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Например, репродуктолог или УЗИ" autoComplete="off" />{query && <button className="icon-button" aria-label="Очистить поиск" onClick={() => { setQuery(''); document.getElementById('service-search')?.focus() }}><X /></button>}</div>
      <div className="svc-catalog-layout">
        <div className="svc-sidebar"><nav className="svc-categories" aria-label="Направления услуг">{[{ id: 'all', title: 'Все направления' }, ...serviceCategories].map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.title}<span>{matches.filter(service => item.id === 'all' || service.categoryId === item.id).length}</span></button>)}</nav><div className="svc-sidebar-note"><p>Первый раз в клинике?</p><a href={serviceHref('reproductologist-first')}>О первом приёме <ArrowUpRight size={18} /></a></div></div>
        <div className="svc-results"><div className="svc-results-heading"><span>{selected?.title || 'Все направления'}</span><span role="status" aria-live="polite">Найдено: {visible.length}</span></div>
          {groups.map(group => <section className="svc-group" key={group.id}><div className="svc-group-heading"><h3>{group.title}</h3><p>{group.description}</p></div><ul>{visible.filter(service => service.categoryId === group.id).map(service => <li key={service.id}><a className="svc-row" href={serviceHref(service.id, linkQuery)}><span className="svc-row-copy"><h4>{service.title}</h4><span>{service.summary}</span></span><strong>{priceLabel(service)}</strong><span className="svc-row-arrow"><ArrowUpRight aria-hidden="true" /></span></a></li>)}</ul></section>)}
          {visible.length === 0 && <div className="svc-empty"><MagnifyingGlass size={32} /><h3>Не нашли такую услугу</h3><p>Попробуйте другое название или сбросьте фильтры. Полный перечень можно уточнить в регистратуре.</p><button className="button button-primary" onClick={() => { setQuery(''); setCategory('all') }}>Сбросить фильтры</button><a href={clinic.phoneHref} className="text-link">Позвонить в клинику <Phone /></a></div>}
          <p className="svc-catalog-note">Здесь представлены основные услуги. Цены справочные; окончательную стоимость и состав уточняйте при записи.</p>
        </div>
      </div>
    </section>
    <section className="svc-help"><div><h2>Помочь выбрать услугу?</h2><p>Администратор подскажет, к кому записаться, и подберёт время приёма.</p></div><a className="button button-primary" href={clinic.phoneHref}><Phone />{clinic.phone}</a></section>
    <section className="svc-faq"><h2>Перед записью</h2><div><details><summary>Можно записаться сразу на исследование?</summary><p>Позвоните в регистратуру и назовите исследование. Администратор уточнит порядок записи и подготовку. Необходимость обследования обсуждается с врачом.</p></details><details><summary>Все услуги входят в указанную стоимость?</summary><p>В карточке указан состав конкретной позиции. Дополнительные консультации и исследования могут оплачиваться отдельно. Итоговую стоимость уточните до визита.</p></details><details><summary>Где узнать об ЭКО по ОМС?</summary><p>Условия программы и порядок обращения опубликованы на сайте клиники.</p><a className="text-link" href={clinic.omsUrl}>Об ЭКО по ОМС <ArrowUpRight /></a></details></div></section>
  </>
}

export default function Services() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('service')
  const service = services.find(item => item.id === id)
  params.delete('service')
  const back = servicesHref + (params.size ? '?' + params.toString() : '')
  useEffect(() => { document.title = service ? `${service.title} | КСМ, Казань` : id ? 'Услуга не найдена | КСМ' : 'Услуги и цены | КСМ, Казань' }, [id, service])
  return <div className="svc-page"><a className="skip-link" href="#main">Перейти к содержимому</a><SiteHeader home={home} /><main id="main" className="svc-shell">{id ? service ? <Details service={service} back={back} /> : <section className="svc-empty"><h1>Услуга не найдена</h1><p>Возможно, ссылка изменилась. Выберите услугу в каталоге.</p><a className="button button-primary" href={servicesHref}>Все услуги</a></section> : <Directory />}</main><Footer /></div>
}
