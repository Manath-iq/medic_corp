import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, List, Phone, X } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DirectionFan from './DirectionFan'
import { LocationSection, ReviewsSection } from './ClinicTrust'
import { FaqSection } from './LandingSections'
import { asset, clinic, prices, rubles, specialists } from './data'
import { media } from './media'

gsap.registerPlugin(ScrollTrigger)

const newsUrl = 'https://ksm-eko.ru/index.php/novosti-i-akcii'
const nav = [['#offers', 'Акции'], ['#directions', 'Услуги'], ['#prices', 'Цены'], ['#doctors', 'Специалисты'], ['#location', 'Контакты']]

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const mobileNav = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (!menuOpen) return
    const desktop = window.matchMedia('(min-width: 951px)')
    const closeOnDesktop = () => {
      if (!desktop.matches) return
      const focusInMobileNav = mobileNav.current?.contains(document.activeElement)
      if (focusInMobileNav || document.activeElement === menuButton.current) {
        root.current?.querySelector<HTMLAnchorElement>('.desktop-nav a')?.focus({ preventScroll: true })
      }
      setMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setMenuOpen(false)
      menuButton.current?.focus({ preventScroll: true })
    }
    closeOnDesktop()
    desktop.addEventListener('change', closeOnDesktop)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      desktop.removeEventListener('change', closeOnDesktop)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 18, opacity: 0, duration: 0.65, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } })
        })
        gsap.from('.trust-facts li', {
          y: 12, opacity: 0.35, duration: 0.38, stagger: 0.055, ease: 'power3.out',
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
    <header className="site-header">
      <div className="nav-bar">
        <a href="#main" className="brand" aria-label="Клиника семейной медицины, на главную">
          <span className="brand-symbol"><img src={asset('logo-small.webp')} alt="КСМ" width={156} height={156} /></span>
          <span>Клиника<br />семейной медицины</span>
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
        <div className="nav-actions"><a className="nav-phone" href={clinic.phoneHref}>{clinic.phone}</a><a className="button button-primary button-small" href="#contact">Первый приём <ArrowUpRight /></a><button ref={menuButton} className="menu-toggle icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>{menuOpen ? <X /> : <List />}</button></div>
      </div>
      {menuOpen && <nav ref={mobileNav} id="mobile-nav" className="mobile-nav" aria-label="Мобильная навигация">{nav.map(([href, label]) => <a key={href} href={href} onClick={() => {
        setMenuOpen(false)
        // Keep keyboard navigation at the chosen section after removing its link.
        const section = document.querySelector<HTMLElement>(href)
        if (section) { section.tabIndex = -1; section.focus({ preventScroll: true }) }
      }}>{label}<ArrowUpRight /></a>)}<a href={clinic.phoneHref}>{clinic.phone}<Phone /></a></nav>}
    </header>

    <main id="main">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-slab">
          <div className="hero-copy">
            <p className="hero-context"><span className="signal-dot" />Репродуктивное здоровье · Казань</p>
            <h1 id="hero-title" className="hero-title"><span className="desktop-copy">Большая мечта<br />начинается<br /><span className="hero-title-accent">с первого шага.</span></span><span className="mobile-copy">Лечение бесплодия<br /><span className="hero-title-accent">и ЭКО.</span></span></h1>
            <div className="hero-support"><p className="hero-lead"><span className="desktop-copy">Диагностика, лечение бесплодия и ЭКО.<br className="desktop-break" /> Рядом, чтобы помочь вам найти свой путь.</span><span className="mobile-copy">Репродуктологи, гинекологи и эмбриологи в Казани.</span></p><div className="hero-actions"><a href="#contact" className="button button-primary">Обсудить первый приём <ArrowUpRight /></a><a href="#directions" className="hero-secondary">Направления <ArrowDown /></a></div></div>
            <div className="hero-location"><span>Клиника семейной медицины</span><span>Казань, Зур Урам, 33</span></div>
          </div>
          <figure className="hero-visual"><img className="hero-image" src={media('hero').src} alt={media('hero').generated ? 'Художественная визуализация лабораторного натюрморта на тему эмбриологии' : 'Эмбриологическая работа под микроскопом — фотография из материалов клиники'} width={1140} height={648} fetchPriority="high" /><div className="hero-visual-shade" /><figcaption><span>Здесь зарождается жизнь</span></figcaption></figure>
        </div>
      </section>

      <section id="offers" className="container offers-section">
        <div className="offers-strip">
          <h2>Акции и скидки</h2>
          <a className="button button-outline" href={clinic.phoneHref}>Уточнить скидки <Phone /></a>
        </div>
      </section>

      <DirectionFan />

      <section id="prices" className="container compact-prices">
        <div className="compact-heading"><h2>Цены на консультации</h2><a className="text-link" href={clinic.pricesUrl} target="_blank" rel="noreferrer">Полный прайс <ArrowUpRight /></a></div>
        <ul className="consultations">{prices.map(price => <li key={price.name}>
          <h3>{price.name}</h3><p>{price.note}</p><strong>{rubles(price.amount)}</strong>
        </li>)}</ul>
      </section>

      <section id="about" className="trust-band">
        <div className="container">
          <h2>Почему нам доверяют</h2>
          <ul className="trust-facts">
            <li><h3>Команда</h3><p>Репродуктологи и эмбриологи ведут приём в одной клинике.</p></li>
            <li><h3>Диагностика</h3><p>В клинике проводят УЗИ и лабораторные исследования.</p></li>
            <li><h3>ЭКО по ОМС</h3><a className="text-link" href={clinic.omsUrl} target="_blank" rel="noreferrer">Условия программы <ArrowUpRight /></a></li>
          </ul>
        </div>
      </section>

      <section id="doctors" className="doctors-section section container">
        <div className="section-heading" data-reveal><h2><span className="desktop-copy">За каждым решением —<br />конкретный человек.</span><span className="mobile-copy">Специалисты<br />клиники.</span></h2><p className="desktop-copy">Специалисты по репродуктивному здоровью<br className="desktop-break" /> и эмбриологии.</p></div>
        <ul className="doctor-grid">{specialists.map(doctor => <li key={doctor.name} className="doctor-card" data-reveal><a className="doctor-photo" href={doctor.url} target="_blank" rel="noreferrer" aria-label={`${doctor.name} ${doctor.given}: сведения на сайте клиники`}><img src={asset(doctor.image)} alt={`${doctor.name} ${doctor.given}`} width={450} height={675} loading="lazy" /><span className="doctor-open"><ArrowUpRight /></span></a><h3>{doctor.name}<span>{doctor.given}</span></h3><p className="doctor-role">{doctor.role}</p><p className="doctor-detail">{doctor.detail}</p></li>)}</ul>
        <a className="text-link all-specialists" href="https://ksm-eko.ru/index.php/home/specialisty" target="_blank" rel="noreferrer">Все специалисты на сайте клиники <ArrowUpRight /></a>
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
          <div className="compact-heading"><h2>Новости</h2><a className="text-link" href={newsUrl} target="_blank" rel="noreferrer">Все новости <ArrowUpRight /></a></div>
          <div className="news-grid">
            <a className="news-item" href={newsUrl + '/priglashaem-stat-donorami-ootsitov'} target="_blank" rel="noreferrer"><small>Объявление клиники</small><span>Приглашаем стать донорами ооцитов <ArrowUpRight /></span></a>
            <a className="news-item" href={clinic.firstVisitUrl} target="_blank" rel="noreferrer"><small>Первый приём</small><span>Как проходит первое знакомство с репродуктологом <ArrowUpRight /></span></a>
            <a className="news-item" href={clinic.preparationUrl} target="_blank" rel="noreferrer"><small>Подготовка к обследованиям</small><span>Памятка перед визитом на обследование <ArrowUpRight /></span></a>
          </div>
        </div>
      </section>
    </main>
    <footer id="footer" className="footer">
      <div className="container">
        <a className="footer-home" href="#main" aria-label="Клиника семейной медицины, наверх">
          <img src={asset('logo-small.webp')} width="52" height="52" alt="" />
          <span>Клиника<br />семейной медицины</span>
        </a>
        <div className="footer-directory">
          <div className="footer-contacts">
            <h2>Регистратура</h2>
            <a className="footer-phone" href={clinic.phoneHref}>{clinic.phone}</a>
            <a className="text-link" href="#location">{clinic.address} <ArrowUpRight /></a>
          </div>
          <nav className="footer-patient-links" aria-label="Информация пациентам">
            <h2>Пациентам</h2>
            <a href={clinic.informationUrl} target="_blank" rel="noreferrer">Сведения и лицензия <ArrowUpRight /></a>
            <a href={clinic.patientUrl} target="_blank" rel="noreferrer">Информация для потребителя <ArrowUpRight /></a>
            <a href={clinic.preparationUrl} target="_blank" rel="noreferrer">Подготовка к исследованиям <ArrowUpRight /></a>
            <a href="#faq">Вопросы и ответы <ArrowUpRight /></a>
            <a href={clinic.website} target="_blank" rel="noreferrer">ksm-eko.ru <ArrowRight /></a>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>Имеются противопоказания.<br />Необходима консультация специалиста.</p>
          <span>КСМ · 2026</span>
        </div>
      </div>
    </footer>
  </div>
}
