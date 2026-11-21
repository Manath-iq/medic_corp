import type { Payload, TypedUser } from 'payload'

const entries = [
  { slug: 'specialists', label: 'Специалисты', action: 'Добавить специалиста', description: 'Команда, квалификация и график приёма', symbol: '01' },
  { slug: 'prices', label: 'Цены', action: 'Открыть прайс', description: 'Одна стоимость на всех страницах сайта', symbol: '02' },
  { slug: 'news', label: 'Новости', action: 'Написать новость', description: 'События и объявления вашей клиники', symbol: '03' },
  { slug: 'promotions', label: 'Акции', action: 'Добавить акцию', description: 'Предложения с понятными условиями', symbol: '04' },
]

export async function Dashboard({ payload, user }: { payload: Payload; user: TypedUser }) {
  const counts = await Promise.all(entries.map(e => payload.count({ collection: e.slug, overrideAccess: false, user })))
  const recent = await payload.find({ collection: 'news', limit: 4, sort: '-updatedAt', overrideAccess: false, user })
  const ending = await payload.find({ collection: 'promotions', limit: 5, where: { and: [{ _status: { equals: 'published' } }, { endsAt: { greater_than: new Date().toISOString() } }, { endsAt: { less_than: new Date(Date.now() + 7 * 86400000).toISOString() } }] }, overrideAccess: false, user })
  return <section className="ksm-overview">
    <header className="ksm-overview-header"><div><p className="ksm-eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО КЛИНИКИ</p><h1>Всё актуально.<br /><span>Всё под контролем.</span></h1><p>Здравствуйте{user?.name ? `, ${user.name}` : ''}. Что обновим сегодня?</p></div><a className="ksm-site-button" href={process.env.SITE_URL || 'http://localhost:4173/medic_corp/'} target="_blank" rel="noreferrer">Посмотреть сайт ↗</a></header>
    <div className="ksm-shortcuts">{entries.map((entry, index) => <a key={entry.slug} className="ksm-shortcut" href={`/admin/collections/${entry.slug}${entry.slug === 'prices' ? '' : '/create'}`}><div className="ksm-shortcut-top"><span>{entry.symbol}</span><b>{counts[index].totalDocs}</b></div><h2>{entry.label}</h2><p>{entry.description}</p><span className="ksm-shortcut-action">{entry.action}<span>↗</span></span></a>)}</div>
    <div className="ksm-overview-bottom"><section className="ksm-workflow"><h2>От правки до публикации</h2><ol><li><b>01</b><div><strong>Измените данные</strong><p>Черновик сохраняется автоматически.</p></div></li><li><b>02</b><div><strong>Посмотрите результат</strong><p>Предпросмотр доступен только сотрудникам.</p></div></li><li><b>03</b><div><strong>Нажмите «Опубликовать»</strong><p>Сайт покажет новую версию при обновлении страницы.</p></div></li></ol></section><section className="ksm-recent"><h2>На заметку</h2>{ending.docs.length > 0 ? ending.docs.map(doc => <a key={doc.id} href={`/admin/collections/promotions/${doc.id}`}>{String(doc.title)}<small>Акция заканчивается в ближайшие 7 дней →</small></a>) : <p>Нет акций, заканчивающихся в ближайшую неделю.</p>}<h3>Последние новости</h3>{recent.docs.length ? recent.docs.map(doc => <a key={doc.id} href={`/admin/collections/news/${doc.id}`}>{String(doc.title)}<small>{doc._status === 'published' ? 'Опубликовано' : 'Черновик'} · {new Date(doc.updatedAt).toLocaleDateString('ru-RU')}</small></a>) : <p>Новостей пока нет. Первая появится здесь после сохранения.</p>}</section></div>
  </section>
}
