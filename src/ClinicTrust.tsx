import { ArrowUpRight, MapPin, NavigationArrow, Star } from '@phosphor-icons/react'
import { clinic } from './data'
import { yandexClinic, yandexReviews } from './yandex'

export function ReviewsSection() {
  return <section id="reviews" className="reviews-section section container" aria-labelledby="reviews-title">
    <div className="section-heading" data-reveal>
      <div><span className="section-kicker">Опыт посещения</span><h2 id="reviews-title">Что говорят<br />о клинике.</h2></div>
      <a className="text-link" href={yandexClinic.reviewsUrl} target="_blank" rel="noreferrer">Все отзывы на Яндекс Картах <ArrowUpRight /></a>
    </div>
    <div className="reviews-layout" data-reveal>
      <aside className="reviews-rating" aria-label="Рейтинг клиники на Яндекс Картах">
        <span className="reviews-platform">Яндекс Карты</span>
        <p className="reviews-rating-value">{yandexClinic.rating}<span>из 5</span><Star weight="fill" aria-hidden="true" /></p>
        <p className="reviews-counts">{yandexClinic.ratings} оценок<span>{yandexClinic.reviews} отзыва</span></p>
        <p className="reviews-snapshot">По данным Яндекса<br />на <time dateTime={yandexClinic.checkedAt}>{yandexClinic.checkedLabel}</time></p>
      </aside>
      <ul className="review-grid">{yandexReviews.map(review => <li className="review-card" key={review.author}>
        <figure>
          <figcaption><cite>{review.author}</cite><span>{'date' in review ? <time dateTime={review.date}>{review.dateLabel}</time> : review.dateLabel}</span></figcaption>
          <blockquote><p>«{review.quote}»</p></blockquote>
          <a className="text-link" href={yandexClinic.reviewsUrl} target="_blank" rel="noreferrer" aria-label={`${review.author}: ${review.excerpt ? 'полный отзыв' : 'отзыв'} на Яндекс Картах`}>{review.excerpt ? 'Полный отзыв' : 'На Яндекс Картах'} <ArrowUpRight /></a>
          {review.excerpt && <span className="review-excerpt">Фрагмент отзыва</span>}
        </figure>
      </li>)}</ul>
    </div>
    <p className="reviews-disclaimer">Выбранные отзывы с Яндекс Карт. Тексты сохранены в авторской редакции; рейтинг и количество оценок могут измениться.</p>
  </section>
}

export function LocationSection() {
  return <section id="location" className="location-section section container" aria-labelledby="location-title">
    <div className="location-layout" data-reveal>
      <div className="location-copy">
        <span className="section-kicker">Встретимся в Казани</span>
        <h2 id="location-title">Как добраться<br />до клиники.</h2>
        <div className="location-address"><MapPin aria-hidden="true" /><div><p>{clinic.address}</p><span>На Яндекс Картах — {yandexClinic.mapAddress}.</span></div></div>
        <p className="location-help">Перед первым визитом уточните у администратора, как найти вход и что взять с собой.</p>
        <div className="location-actions"><a className="button button-primary" href={yandexClinic.routeUrl} target="_blank" rel="noreferrer">Построить маршрут <NavigationArrow /></a><a className="text-link" href={clinic.phoneHref}>Позвонить в клинику <ArrowUpRight /></a></div>
        <p className="location-service-note">Маршрут откроется в Яндекс Картах. Начальную точку можно выбрать там.</p>
      </div>
      <div className="location-map-shell">
        <iframe
          className="location-map"
          title="Клиника семейной медицины на Яндекс Картах — Зур Урам, 33/22"
          src={yandexClinic.embedUrl}
          referrerPolicy="no-referrer"
          allowFullScreen
        />
        <a className="location-map-fallback text-link" href={yandexClinic.url} target="_blank" rel="noreferrer">Открыть клинику на Яндекс Картах <ArrowUpRight /></a>
      </div>
    </div>
  </section>
}
