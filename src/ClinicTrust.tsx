import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, NavigationArrow, Star } from '@phosphor-icons/react'
import { clinic } from './data'
import { yandexClinic, yandexReviews } from './yandex'
import { safeHref, siteContent } from './content'

export function ReviewsSection() {
  const track = useRef<HTMLDivElement>(null)
  const reviews = siteContent()?.reviews ?? yandexReviews
  function move(step: number) {
    const el = track.current
    if (!el || el.children.length < 2) return
    const cards = el.children as HTMLCollectionOf<HTMLElement>
    const stride = cards[1].offsetLeft - cards[0].offsetLeft
    const end = el.scrollWidth - el.clientWidth
    let left = (Math.round(el.scrollLeft / stride) + step) * stride
    if (step > 0 && el.scrollLeft >= end - 1) left = 0
    if (step < 0 && el.scrollLeft <= 1) left = end
    el.scrollTo({ left })
  }
  if (!reviews.length) return null
  return <section id="reviews" className="reviews-section section container" aria-labelledby="reviews-title">
    <div className="reviews-heading">
      <h2 id="reviews-title">Отзывы</h2>
      <div className="review-controls">
        <button type="button" aria-label="Предыдущий отзыв" onClick={() => move(-1)}><ArrowLeft /></button>
        <button type="button" aria-label="Следующий отзыв" onClick={() => move(1)}><ArrowRight /></button>
      </div>
    </div>
    <div className="review-track" ref={track} tabIndex={0} role="region" aria-label="Отзывы пациентов">
      {reviews.map((review, index) => <figure className="review-slide" key={index}>
        {review.rating && <div className="review-stars" role="img" aria-label={`Оценка ${review.rating} из 5`}>
          {[1, 2, 3, 4, 5].map(value => <Star key={value} weight={value <= (review.rating || 0) ? 'fill' : 'regular'} aria-hidden="true" />)}
        </div>}
        <blockquote>«{review.quote}»</blockquote>
        <figcaption><strong>{review.author}</strong><span>{review.dateLabel}{review.excerpt && ' · Фрагмент отзыва'}</span></figcaption>
      </figure>)}
    </div>
    <a className="text-link" href={safeHref(siteContent()?.clinic.reviewsUrl || yandexClinic.reviewsUrl)} target="_blank" rel="noreferrer">Все отзывы на Яндекс Картах <ArrowUpRight /></a>
  </section>
}

export function LocationSection() {
  const c = siteContent()?.clinic
  const location = c ? { ...yandexClinic, mapAddress: c.mapAddress, routeUrl: c.routeUrl, url: c.mapUrl, embedUrl: `https://yandex.ru/map-widget/v1/?ll=${c.lng}%2C${c.lat}&z=17&pt=${c.lng}%2C${c.lat}%2Cpm2rdm&l=map&lang=ru_RU` } : yandexClinic
  const [mapEnabled, setMapEnabled] = useState(false)
  const map = useRef<HTMLIFrameElement>(null)
  useLayoutEffect(() => { if (mapEnabled) map.current?.focus({ preventScroll: true }) }, [mapEnabled])
  return <section id="location" className="location-section section container" aria-labelledby="location-title">
    <div className="location-layout" data-reveal>
      <div className="location-copy">
        <h2 id="location-title">Как добраться<br />до клиники.</h2>
        <div className="location-address"><MapPin aria-hidden="true" /><div><p>{clinic.address}</p><span>На Яндекс Картах — {location.mapAddress}.</span></div></div>
        <p className="location-help">{clinic.hours}{clinic.holidayHours && <><br />{clinic.holidayHours}</>}</p>
        <div className="location-actions"><a className="button button-primary" href={safeHref(location.routeUrl)} target="_blank" rel="noreferrer">Построить маршрут <NavigationArrow /></a><a className="text-link" href={clinic.phoneHref}>Позвонить в клинику <ArrowUpRight /></a></div>
      </div>
      <div className="location-map-shell">
        {mapEnabled ? <iframe
          ref={map}
          className="location-map"
          title="Клиника семейной медицины на Яндекс Картах — Зур Урам, 33/22"
          src={location.embedUrl}
          referrerPolicy="no-referrer"
          allowFullScreen
        /> : <div className="location-map location-map-placeholder">
          <MapPin aria-hidden="true" />
          <p>Клиника семейной медицины</p>
          <span>{location.mapAddress}</span>
          <p id="map-privacy" className="location-map-privacy">При включении карты браузер подключится к Яндексу.</p>
          <button type="button" className="button button-primary" aria-describedby="map-privacy" onClick={() => setMapEnabled(true)}>Показать карту Яндекса</button>
        </div>}
        <a className="location-map-fallback text-link" href={safeHref(location.url)} target="_blank" rel="noreferrer">Открыть клинику на Яндекс Картах <ArrowUpRight /></a>
      </div>
    </div>
  </section>
}
