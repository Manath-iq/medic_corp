import { useLayoutEffect, useRef } from 'react'
import { UsersThree, Microscope, IdentificationCard, ArrowUpRight, Phone } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Footer from './Footer'
import SiteHeader from './SiteHeader'
import DirectionFan from './DirectionFan'
import { LocationSection, ReviewsSection } from './ClinicTrust'
import { FaqSection } from './LandingSections'
import { asset, clinic, prices, rubles, specialists } from './data'
import { specialistHref, specialistsHref } from './specialist-links'
import { media } from './media'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 18, opacity: 0, duration: 0.65, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } })
        })
        gsap.from('.trust-facts li', {
          y: 12, duration: 0.38, stagger: 0.055, ease: 'power3.out',
          scrollTrigger: { trigger: '.trust-facts', start: 'top 92%', once: true },
        })
        gsap.to('.hero-image', { yPercent: -5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      }, root)
      return () => context.revert()
    })
    // Region changes, native FAQ expansion and late fonts/images can move scroll triggers.
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    if (root.current) observer.observe(root.current)
    return () => { observer.disconnect(); cancelAnimationFrame(frame); media.revert() }
  }, [])

  return <div ref={root}>
    <a href="#main" className="skip-link">Перейти к содержимому</a>
    <SiteHeader />

    <main id="main">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-slab">
          <div className="hero-copy">
            <p className="hero-context"><span className="signal-dot" />Репродуктивное здоровье · Казань</p>
            <h1 id="hero-title" className="hero-title"><span className="desktop-copy">Большая мечта<br />начинается<br /><span className="hero-title-accent">с первого шага.</span></span><span className="mobile-copy">Лечение бесплодия<br /><span className="hero-title-accent">и ЭКО.</span></span></h1>
            <div className="hero-support"><p className="hero-lead"><span className="desktop-copy">Диагностика, лечение бесплодия и ЭКО.<br className="desktop-break" /> Рядом, чтобы помочь вам найти свой путь.</span><span className="mobile-copy">Репродуктологи, гинекологи и эмбриологи в Казани.</span></p><div className="hero-actions"><a href="#contact" className="button button-primary">Записаться на приём <ArrowUpRight /></a></div></div>
            <div className="hero-location"><span>Клиника семейной медицины</span><span>Казань, Зур Урам, 33</span></div>
          </div>
          <figure className="hero-visual"><img className="hero-image" src={media('hero').src} alt={media('hero').generated ? 'Художественная визуализация лабораторного натюрморта на тему эмбриологии' : 'Эмбриологическая работа под микроскопом — фотография из материалов клиники'} width={1140} height={648} fetchPriority="high" /><div className="hero-visual-shade" /><figcaption><span>Здесь зарождается жизнь</span></figcaption></figure>
        </div>
      </section>

      <section id="offers" className="container offers-section">
        <div className="offers-strip">
          <h2>Акции и скидки</h2>
          <a className="button button-outline" href={clinic.offersUrl}>Посмотреть акции <ArrowUpRight /></a>
        </div>
      </section>

      <DirectionFan />

      <section id="prices" className="container compact-prices">
        <div className="compact-heading"><h2>Цены на консультации</h2><a className="text-link" href={clinic.priceListUrl}>Цены по направлениям <ArrowUpRight /></a></div>
        <ul className="consultations">{prices.map(price => <li key={price.name}>
          <h3>{price.name}</h3><p>{price.note}</p><strong>{rubles(price.amount)}</strong>
        </li>)}</ul>
      </section>

      <section id="about" className="trust-band">
        <div className="container">
          <h2>Почему нам доверяют</h2>
          <ul className="trust-facts">
            <li><h3><UsersThree size={24} aria-hidden="true" />Команда</h3><p>Репродуктологи и эмбриологи ведут приём в одной клинике.</p></li>
            <li><h3><Microscope size={24} aria-hidden="true" />Диагностика</h3><p>В клинике проводят УЗИ и лабораторные исследования.</p></li>
            <li><h3><IdentificationCard size={24} aria-hidden="true" />ЭКО по ОМС</h3><a className="text-link" href={clinic.omsUrl}>Условия программы <ArrowUpRight /></a></li>
          </ul>
        </div>
      </section>

      <section id="doctors" className="doctors-section section container">
        <div className="section-heading" data-reveal><h2><span className="desktop-copy">За каждым решением —<br />конкретный человек.</span><span className="mobile-copy">Специалисты<br />клиники.</span></h2><p className="desktop-copy">Специалисты по репродуктивному здоровью<br className="desktop-break" /> и эмбриологии.</p></div>
        <ul className="doctor-grid">{specialists.map(doctor => <li key={doctor.id} className="doctor-card" data-reveal><a style={{ display: 'block' }} href={specialistHref(doctor.id)} aria-label={`${doctor.name} ${doctor.given}, профиль специалиста`}><span className="doctor-photo"><img src={asset(doctor.image)} alt={`${doctor.name} ${doctor.given}`} width={450} height={675} loading="lazy" /><span className="doctor-open"><ArrowUpRight /></span></span><h3>{doctor.name}<span>{doctor.given}</span></h3><p className="doctor-role">{doctor.role}</p><p className="doctor-detail">{doctor.detail}</p></a></li>)}</ul>
        <a className="text-link all-specialists" href={specialistsHref}>Все специалисты <ArrowUpRight /></a>
      </section>

      <section id="contact" className="container">
        <div className="booking-strip">
          <div><h2>Записаться на приём</h2><p>С выбором специалиста поможет регистратура.</p></div>
          <a className="button" href={clinic.phoneHref}><Phone /> {clinic.phone}</a>
        </div>
      </section>
      <ReviewsSection />
      <FaqSection />
      <LocationSection />
      <section id="news" className="news-section">
        <div className="container">
          <div className="compact-heading"><h2>Новости</h2><a className="text-link" href={clinic.offersUrl}>Акции и объявления <ArrowUpRight /></a></div>
          <div className="news-grid">
            <a className="news-item" href={clinic.offersUrl + '#announcements'}><small>Объявление клиники</small><span>Приглашаем стать донорами ооцитов <ArrowUpRight /></span></a>
            <a className="news-item" href={clinic.firstVisitUrl}><small>Первый приём</small><span>Как проходит первое знакомство с репродуктологом <ArrowUpRight /></span></a>
            <a className="news-item" href={clinic.preparationUrl}><small>Подготовка к обследованиям</small><span>Памятка перед визитом на обследование <ArrowUpRight /></span></a>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
}
