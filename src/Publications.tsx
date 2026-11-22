import { ArrowUpRight, Phone } from '@phosphor-icons/react'
import { siteContent, pageLocation } from './content'
import SiteHeader from './SiteHeader'
import Footer from './Footer'
import { getClinic } from './data'
import { getServices } from './services-data'
import { serviceHref } from './services-links'
import RichText from './RichText'
import './public-content.css'

const date = (value?: string) => value ? new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }) : ''
export default function Publications({ kind }: { kind: 'offers' | 'news' }) {
  const clinic = getClinic(), services = getServices()
  const home = import.meta.env.BASE_URL
  const offers = kind === 'offers'
  const content = siteContent()
  const records = offers ? content?.promotions || [] : content?.news || []
  const key = pageLocation().searchParams.get(offers ? 'offer' : 'post')
  const record = records.find(p => p.id === key)
  const title = key ? record?.title || 'Материал не найден' : offers ? 'Акции клиники' : 'Новости клиники'
  const active = records.filter(p => !offers || p.active)
  return <><a className="skip-link" href="#main">Перейти к содержимому</a><SiteHeader home={home} /><main id="main" className="publication-page container"><a className="text-link" href={key ? `${home}${kind}/` : home}>← {key ? offers ? 'Все акции' : 'Все новости' : 'Главная'}</a><header className="publication-heading">{record && <p className="publication-date">{offers ? `${date(record.startsAt)} — ${date(record.endsAt)}` : date(record.publishedAt)}</p>}<h1>{title}</h1>{record?.excerpt && <p>{record.excerpt}</p>}{!key && <p>{offers ? 'Действующие предложения и условия участия.' : 'События, объявления и полезная информация от клиники.'}</p>}</header>
    {record ? <article className="publication-article">{record.cover && <img className="publication-cover" src={record.cover} alt={record.coverAlt} width={1100} height={650} />}{offers && !record.active && <div className="publication-ended">{Date.parse(record.startsAt || '') > Date.now() ? 'Акция ещё не началась' : 'Акция завершена'}. Актуальные предложения уточните в регистратуре.</div>}{record.benefit && <h2>{record.benefit}</h2>}<RichText content={record.body} />{record.conditions && <section><h2>Условия участия</h2><p className="preserve-lines">{record.conditions}</p></section>}{record.serviceIds.length > 0 && <section><h2>Связанные услуги</h2><ul className="info-links">{services.filter(s => record.serviceIds.includes(s.id)).map(s => <li key={s.id}><a href={serviceHref(s.id)}>{s.title}<ArrowUpRight /></a></li>)}</ul></section>}<a className="button button-primary" href={clinic.phoneHref}><Phone />Позвонить в клинику</a></article> : key ? <p>Возможно, материал снят с публикации. Выберите другой в списке.</p> : active.length ? <div className="publication-grid">{active.map(p => <a className="publication-card" key={p.id} href={`${home}${kind}/?${offers ? 'offer' : 'post'}=${encodeURIComponent(p.id)}`}>{p.cover && <img src={p.cover} alt={p.coverAlt} width={640} height={400} loading="lazy" />}<div><small>{offers ? `До ${date(p.endsAt)}` : date(p.publishedAt)}</small><h2>{p.title}</h2><p>{p.excerpt}</p><span>Подробнее <ArrowUpRight /></span></div></a>)}</div> : <div className="publication-empty"><h2>{offers ? 'Сейчас нет действующих акций' : 'Новости появятся здесь'}</h2><p>{offers ? 'Стоимость услуг доступна в каталоге. По вопросам записи позвоните в регистратуру.' : 'Следите за событиями клиники. По вопросам приёма обращайтесь в регистратуру.'}</p><a className="button button-primary" href={offers ? clinic.priceListUrl : clinic.phoneHref}>{offers ? 'Услуги и цены' : 'Позвонить в клинику'}</a></div>}
  </main><Footer /></>
}
