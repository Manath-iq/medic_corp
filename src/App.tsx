import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, List, Phone, X } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DirectionFan from './DirectionFan'
import { AboutSection, FaqSection, OmsSection, StartSection } from './LandingSections'
import { asset, clinic, prices, rubles, specialists } from './data'
import { media } from './media'

gsap.registerPlugin(ScrollTrigger)

const nav = [['#directions', 'Направления'], ['#doctors', 'Специалисты'], ['#prices', 'Стоимость'], ['#oms', 'ЭКО по ОМС'], ['#contact', 'Контакты']]

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState('Все консультации')
  const categories = ['Все консультации', ...new Set(prices.map(price => price.category))]

  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
        timeline.from('.hero-context', { y: 12, opacity: 0, duration: 0.5 })
          .from('.hero-title', { y: 24, opacity: 0, duration: 0.8 }, '-=0.28')
          .from('.hero-support', { y: 16, opacity: 0, duration: 0.6 }, '-=0.5')
          .from('.hero-visual', { y: 24, opacity: 0, duration: 0.8 }, '-=0.65')
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 18, opacity: 0, duration: 0.65, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } })
        })
        gsap.fromTo('.statement-word', { opacity: 0.26 }, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 75%', end: 'bottom 60%', scrub: true } })
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
          <span className="brand-symbol"><img src={asset('logo.png')} alt="КСМ" width={550} height={550} /></span>
          <span>Клиника<br />семейной медицины</span>
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
        <div className="nav-actions"><a className="nav-phone" href={clinic.phoneHref}>{clinic.phone}</a><a className="button button-primary button-small" href="#contact">Первый приём <ArrowUpRight /></a><button className="menu-toggle icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>{menuOpen ? <X /> : <List />}</button></div>
      </div>
      {menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Мобильная навигация" onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false) }}>{nav.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight /></a>)}<a href={clinic.phoneHref}>{clinic.phone}<Phone /></a></nav>}
    </header>

    <main id="main">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-slab">
          <div className="hero-copy">
            <p className="hero-context"><span className="signal-dot" />Репродуктивное здоровье · Казань</p>
            <h1 id="hero-title" className="hero-title">Большая мечта<br />начинается<br /><span>с первого шага.</span></h1>
            <div className="hero-support"><p className="hero-lead">Диагностика, лечение бесплодия и ЭКО.<br className="desktop-break" /> Рядом, чтобы помочь вам найти свой путь.</p><div className="hero-actions"><a href="#contact" className="button button-primary">Обсудить первый приём <ArrowUpRight /></a><a href="#directions" className="hero-secondary">Направления <ArrowDown /></a></div></div>
            <div className="hero-location"><span>Клиника семейной медицины</span><span>Казань, Зур Урам, 33</span></div>
          </div>
          <figure className="hero-visual"><img className="hero-image" src={media('hero').src} alt={media('hero').generated ? 'Художественная визуализация лабораторного натюрморта на тему эмбриологии' : 'Эмбриологическая работа под микроскопом — фотография из материалов клиники'} width={1140} height={648} fetchPriority="high" /><div className="hero-visual-shade" /><figcaption><span>Здесь зарождается жизнь</span><span className="hero-visual-note">{media('hero').generated ? 'Художественная визуализация' : 'Эмбриология и репродуктивные технологии'}</span></figcaption><span className="hero-image-index" aria-hidden="true">КСМ / КАЗАНЬ</span></figure>
        </div>
        <div className="hero-bottom"><span className="concept-label">Концепция нового сайта <span>·</span> Предварительный просмотр</span><a href="#directions">Давайте начнём знакомство <ArrowDown /></a></div>
      </section>

      <DirectionFan />

      <section className="statement section container" aria-label="Первый шаг">
        <p className="statement-text">{'Не обязательно знать все ответы, чтобы прийти на первую консультацию.'.split(' ').map((word, index) => <span className="statement-word" key={index}>{word} </span>)}</p>
        <div className="statement-bottom"><span className="signal-dot" /><p>Начните с разговора.<br />С выбором специалиста поможет регистратура.</p><a className="text-link" href="#contact">Сделать первый шаг <ArrowUpRight /></a></div>
      </section>

      <section id="doctors" className="doctors-section section container">
        <div className="section-heading" data-reveal><h2>За каждым решением —<br />конкретный человек.</h2><p>Специалисты по репродуктивному здоровью<br className="desktop-break" /> и эмбриологии. Познакомьтесь ближе.</p></div>
        <ul className="doctor-grid">{specialists.map((doctor, index) => <li key={doctor.name} className="doctor-card" data-reveal><a className="doctor-photo" href={doctor.url} target="_blank" rel="noreferrer" aria-label={`${doctor.name} ${doctor.given}: сведения на сайте клиники`}><img src={asset(doctor.image)} alt={`${doctor.name} ${doctor.given}`} width={450} height={675} loading="lazy" /><span className="doctor-number">0{index + 1}</span><span className="doctor-open"><ArrowUpRight /></span></a><h3>{doctor.name}<span>{doctor.given}</span></h3><p className="doctor-role">{doctor.role}</p><p className="doctor-detail">{doctor.detail}</p></li>)}</ul>
        <a className="text-link all-specialists" href="https://ksm-eko.ru/index.php/home/specialisty" target="_blank" rel="noreferrer">Все специалисты на сайте клиники <ArrowUpRight /></a>
      </section>

      <section id="prices" className="prices-section section container">
        <div className="prices-layout"><div className="prices-intro" data-reveal><span className="section-kicker">Стоимость консультаций</span><h2>Первый шаг.<br />Понятная цена.</h2><p>Выберите консультацию.<br />Полный перечень исследований и программ — в прайсе клиники.</p><a className="button button-outline" href={clinic.pricesUrl} target="_blank" rel="noreferrer">Полный прайс <ArrowUpRight /></a><span className="price-source">По открытому прайсу КСМ.<br />Актуальность уточните при записи.</span></div>
          <div className="price-panel" data-reveal><div className="price-filters" aria-label="Категории консультаций">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><ul className="price-list">{prices.filter(price => category === 'Все консультации' || category === price.category).map(price => <li key={price.name}><div><h3>{price.name}</h3><p>{price.note}</p></div><span className="price-amount">{rubles(price.amount)}</span><a href="#contact" className="price-action icon-button" aria-label={`${price.name}: уточнить запись`}><ArrowUpRight /></a></li>)}</ul><p className="price-panel-note">Стоимость указана для консультаций. Дополнительные исследования оплачиваются по действующему прайсу.</p></div>
        </div>
      </section>

      <OmsSection />
      <StartSection />
      <AboutSection />
      <FaqSection />

      <section id="contact" className="contact-section container">
        <div className="contact-slab"><div><span className="section-kicker">Будем рядом</span><h2>Давайте начнём<br />с разговора.</h2><p>Уточните подходящий приём и удобное время<br className="desktop-break" /> у администратора клиники.</p><a className="button button-primary" href={clinic.phoneHref}>Позвонить в клинику <ArrowUpRight /></a></div><div className="contact-details"><a className="contact-phone" href={clinic.phoneHref}>{clinic.phone}</a><p>{clinic.address}</p><dl><div><dt>Понедельник — пятница</dt><dd>08:00–16:00</dd></div><div><dt>Суббота</dt><dd>08:00–14:00</dd></div><div><dt>Воскресенье</dt><dd>Выходной</dd></div></dl><a className="text-link" href="https://yandex.ru/maps/?text=Казань%2C%20Зур%20Урам%2C%2033" target="_blank" rel="noreferrer">Открыть маршрут <ArrowUpRight /></a></div></div>
      </section>
    </main>
    <footer className="footer container">
      <div className="footer-top"><a className="footer-title" href="#main">Клиника семейной медицины<span>Репродуктивное здоровье. Казань.</span></a><a className="text-link" href={clinic.website} target="_blank" rel="noreferrer">Действующий сайт <ArrowRight /></a></div>
      <nav className="footer-patient-links" aria-label="Информация пациентам"><a href={clinic.informationUrl} target="_blank" rel="noreferrer">Сведения и лицензия <ArrowUpRight /></a><a href={clinic.patientUrl} target="_blank" rel="noreferrer">Информация для потребителя <ArrowUpRight /></a><a href={clinic.preparationUrl} target="_blank" rel="noreferrer">Подготовка к исследованиям <ArrowUpRight /></a><a href="#faq">Вопросы и ответы <ArrowDown /></a></nav>
      <div className="footer-bottom"><p>Имеются противопоказания.<br />Необходима консультация специалиста.</p><p>Презентационная концепция, не официальный сайт.<br />Сбор персональных данных не ведётся.</p><span>КСМ · Концепция 2026</span></div>
      <p className="footer-media-note">{media('hero').generated || media('oms').generated ? 'Предметные изображения — художественные визуализации, не фотографии клиники или пациентов. ' : ''}Фотографии специалистов и диагностического оборудования — из материалов действующего сайта КСМ. Информация и цены требуют подтверждения в клинике.</p>
    </footer>
  </div>
}
