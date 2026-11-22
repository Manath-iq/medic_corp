import { useEffect } from 'react'
import { Phone, ArrowUpRight } from '@phosphor-icons/react'
import SiteHeader from './SiteHeader'
import Footer from './Footer'
import { getClinic } from './data'
import { safeHref, siteContent, pageRoute, pageLocation } from './content'
import RichText from './RichText'
import Publications from './Publications'

export default function Information() {
  const clinic = getClinic()
  const route = pageRoute()
  const key = route === 'pages' ? pageLocation().searchParams.get('page') || '' : route
  const content = siteContent()!
  const page = content.pages.find(p => p.id === key)
  const c = content.clinic
  const home = import.meta.env.BASE_URL
  const title = key === 'contacts' ? 'Контакты' : page?.title || 'Страница не найдена'
  useEffect(() => {
    const target = document.getElementById(location.hash.slice(1))
    if (target instanceof HTMLDetailsElement) target.open = true
    target?.scrollIntoView({ behavior: 'instant' })
  }, [key, title, page])
  if (key === 'offers' || key === 'news') return <Publications kind={key} />
  const contacts = <dl className="info-facts"><div><dt>Адрес</dt><dd>{c.address}</dd></div><div><dt>Регистратура</dt><dd><a href={c.phoneHref}>{c.phone}</a>{c.extraPhone && <> · <a href={`tel:${c.extraPhone.replace(/[^+\d]/g, '')}`}>{c.extraPhone}</a></>}</dd></div>{c.email && <div><dt>Электронная почта</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>}<div><dt>Часы работы</dt><dd>{c.hours}{c.holidayHours && <p>{c.holidayHours}</p>}</dd></div></dl>
  return <><a className="skip-link" href="#main">Перейти к содержимому</a><SiteHeader home={home} /><main className="info-page container" id="main"><header className="info-intro"><div><a href={home}>← Главная</a><h1>{title}</h1><p>{page?.lead || (key === 'contacts' ? 'Телефоны для записи, часы работы и маршрут до клиники.' : 'Выберите нужный раздел в меню сайта.')}</p></div>{page?.image && <img src={page.image} alt="" width={400} height={300} />}</header>
    {(page || key === 'contacts') && <div className="info-layout"><aside><nav aria-label="На этой странице">{(key === 'contacts' || key === 'about') && <a href="#contacts">Контакты</a>}{key === 'about' && <a href="#license">Лицензия</a>}{page?.sections.map(s => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}</nav><a className="button button-primary" href={clinic.phoneHref}><Phone />Регистратура</a></aside><div className="info-content">
      {(key === 'contacts' || key === 'about') && <section id="contacts"><h2>Контакты и режим работы</h2>{contacts}</section>}
      {key === 'contacts' && <section id="route"><h2>Как добраться</h2><p>На карте — {c.mapAddress}.</p><ul className="info-links"><li><a href={safeHref(c.routeUrl)}>Построить маршрут <ArrowUpRight /></a></li><li><a href={safeHref(c.mapUrl)}>Открыть карту <ArrowUpRight /></a></li></ul></section>}
      {key === 'about' && <section id="license"><h2>Сведения и лицензия</h2><p>{c.legalName}</p><p>ИНН {c.inn} · ОГРН {c.ogrn}</p><p>{c.license}</p><ul className="info-links">{c.licenseDocuments.map(d => <li key={d.id}><a href={safeHref(d.url)}>{d.title}<ArrowUpRight /></a></li>)}</ul></section>}
      {page?.sections.map(s => <section key={s.id} id={s.id}><h2>{s.title}</h2><RichText content={s.body} /><ul className="info-links">{s.documents.map(d => <li key={d.id}><a href={safeHref(d.url)}>{d.title}<ArrowUpRight /></a></li>)}{s.links.map((l, i) => <li key={i}><a href={safeHref(l.href)}>{l.label}<ArrowUpRight /></a></li>)}</ul></section>)}
    </div></div>}
  </main><Footer /></>
}
