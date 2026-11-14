import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowUpRight, MapPin, Plus } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { asset, clinic, firstSteps, omsRoutes, questions } from './data'
import { media } from './media'

gsap.registerPlugin(ScrollTrigger)

type Region = keyof typeof omsRoutes

export function OmsSection() {
  const [region, setRegion] = useState<Region>('tatarstan')
  const route = omsRoutes[region]
  const image = media('oms')

  return <section id="oms" className="oms-section container" aria-labelledby="oms-title">
    <div className="oms-slab">
      <div className="oms-top">
        <div className="oms-copy" data-reveal>
          <span className="section-kicker">ЭКО по ОМС</span>
          <h2 id="oms-title"><span className="desktop-copy">Начнём<br />с понятного<br /><span>маршрута.</span></span><span className="mobile-copy">Как пройти<br />ЭКО по ОМС.</span></h2>
          <p>Для жителей Татарстана и других регионов России. Порядок направления зависит от региона — разберёмся с первым шагом.</p>
          <a className="button button-primary" href={clinic.phoneHref}>Уточнить участие <ArrowUpRight /></a>
        </div>
        <figure className="oms-visual" data-reveal>
          <img src={image.src} alt={image.generated ? 'Художественная метафора пути: ступени и прозрачная арка' : 'Лабораторный кадр из материалов сайта КСМ'} width={1600} height={1200} loading="lazy" />
          <figcaption>{image.generated ? 'Художественная визуализация' : 'Из материалов сайта КСМ'}</figcaption>
        </figure>
      </div>
      <div className="oms-route">
        <fieldset className="region-switch">
          <legend>Откуда вы планируете приехать?</legend>
          <div className="region-options">{(Object.keys(omsRoutes) as Region[]).map(key => <label key={key}>
            <input type="radio" name="oms-region" value={key} checked={region === key} onChange={() => setRegion(key)} aria-controls="oms-route-panel" />
            <span>{omsRoutes[key].label}</span>
          </label>)}</div>
        </fieldset>
        <div id="oms-route-panel" className="oms-route-panel" role="region" aria-labelledby="oms-route-title">
          <h3 id="oms-route-title">{route.title}</h3>
          <ol className="oms-steps" style={{ '--step-count': route.steps.length } as CSSProperties}>
            {route.steps.map((step, index) => <li key={`${region}-${step.title}`}><span className="oms-step-number" aria-hidden="true">0{index + 1}</span><h4>{step.title}</h4><p>{step.body}</p></li>)}
          </ol>
        </div>
        <div className="oms-note"><p>Направление выдаётся по решению комиссии, по медицинским показаниям. Квота не гарантируется. Услуги вне базовой программы оплачиваются отдельно — состав и условия уточните в клинике.</p><a className="text-link" href={route.source} target="_blank" rel="noreferrer">Полные условия ОМС <ArrowUpRight /></a></div>
      </div>
    </div>
  </section>
}

export function StartSection() {
  const list = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const markers = [...element.querySelectorAll<HTMLElement>('.route-marker')]
    const items = [...element.querySelectorAll<HTMLElement>('.route-step')]
    const line = element.querySelector<HTMLElement>('.route-line')!
    const fill = element.querySelector<HTMLElement>('.route-fill')!
    let thresholds: number[] = []
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      const centers = markers.map(marker => {
        const rect = marker.getBoundingClientRect()
        return rect.top + rect.height / 2 - bounds.top
      })
      const length = centers.at(-1)! - centers[0]
      line.style.top = `${centers[0]}px`
      line.style.height = `${Math.max(0, length)}px`
      thresholds = centers.map(center => length ? (center - centers[0]) / length : 0)
    }
    measure()
    const match = gsap.matchMedia()
    match.add('(prefers-reduced-motion: no-preference)', () => {
      const tween = gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: {
        trigger: markers[0], start: 'center 65%', endTrigger: markers.at(-1), end: 'center 65%', scrub: true,
        onRefreshInit: measure,
        onUpdate: self => items.forEach((item, index) => { item.dataset.reached = String(self.progress >= thresholds[index]) }),
      } })
      return () => {
        tween.scrollTrigger?.kill()
        tween.revert()
        items.forEach(item => { delete item.dataset.reached })
      }
    })
    const observer = new ResizeObserver(() => { measure(); ScrollTrigger.refresh() })
    observer.observe(element)
    return () => { observer.disconnect(); match.revert() }
  }, [])

  return <section id="start" className="start-section section container" aria-labelledby="start-title">
    <div className="start-layout">
      <div className="start-intro" data-reveal><span className="section-kicker">Как начать</span><h2 id="start-title"><span className="desktop-copy">Не весь путь сразу.<br />Только ближайший шаг.</span><span className="mobile-copy">Первый визит<br />в три шага.</span></h2><p className="desktop-copy">Не нужно разбираться во всём до первой встречи. Начните с записи — дальнейший план обсудите с врачом.</p><a className="text-link" href="#contact">Контакты клиники <ArrowUpRight /></a></div>
      <div ref={list} className="start-route-wrap">
        <span className="route-line" aria-hidden="true"><span className="route-fill" /></span>
        <ol className="start-route">{firstSteps.map(step => <li className="route-step" key={step.id}><span className="route-marker" aria-hidden="true">{step.number}</span><div><h3>{step.title}</h3><p><span className="desktop-copy">{step.body}</span><span className="mobile-copy">{step.shortBody}</span></p><a className="text-link" href={step.href} {...(step.href.startsWith('https:') ? { target: '_blank', rel: 'noreferrer' } : {})}>{step.label}<ArrowUpRight /></a></div></li>)}</ol>
      </div>
    </div>
  </section>
}

export function AboutSection() {
  return <section id="about" className="about-section section container" aria-labelledby="about-title">
    <div className="about-layout">
      <figure className="about-visual" data-reveal><img src={asset('diagnostics.webp')} alt="Ультразвуковой аппарат — фотография из материалов действующего сайта КСМ" width={1140} height={648} loading="lazy" /><figcaption><MapPin aria-hidden="true" /><span>Казань, Зур Урам, 33<small>Из материалов действующего сайта КСМ</small></span></figcaption></figure>
      <div className="about-copy" data-reveal><span className="section-kicker">О клинике</span><h2 id="about-title">Репродуктивное<br />здоровье.<br />Личная история.</h2><p>Клиника семейной медицины в Казани занимается диагностикой и лечением женского и мужского бесплодия, программами ЭКО и вопросами репродуктивного здоровья.</p>
        <dl className="about-facts"><div><dt>Специалисты</dt><dd>Репродуктологи и эмбриологи</dd></div><div><dt>Диагностика</dt><dd>УЗИ и лабораторные исследования</dd></div><div><dt>Программы</dt><dd>ЭКО, в том числе по ОМС</dd></div></dl>
        <a className="text-link" href={clinic.informationUrl} target="_blank" rel="noreferrer">Сведения о клинике и лицензия <ArrowUpRight /></a>
      </div>
    </div>
  </section>
}

export function FaqSection() {
  return <section id="faq" className="faq-section section container" aria-labelledby="faq-title">
    <div className="faq-layout">
      <div className="faq-intro" data-reveal><h2 id="faq-title">Вопросы перед визитом</h2></div>
      <div className="faq-list">{questions.map((item, index) => <details className="faq-item" name="clinic-faq" key={item.id}>
        <summary><span className="faq-number" aria-hidden="true">0{index + 1}</span><span className="faq-question">{item.question}</span><Plus aria-hidden="true" /></summary>
        <div className="faq-answer"><p>{item.answer}</p><a className="text-link" href={item.href} {...(item.href.startsWith('https:') ? { target: '_blank', rel: 'noreferrer' } : {})}>{item.label}<ArrowUpRight /></a></div>
      </details>)}</div>
    </div>
  </section>
}
