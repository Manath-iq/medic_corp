import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import { directions } from './data'
import { media } from './media'
import type { MediaSlot } from './media'

// Arc/rotation vocabulary adapted from the user's DENTIS fan-carousel.js.
// No cloned focus targets, autoplay, perpetual frame loop, or hidden unique copy.
export default function DirectionFan() {
  const [center, setCenter] = useState(0)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(208)
  const stage = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)
  const gesture = useRef<{ x: number; y: number; id: number; horizontal: boolean } | null>(null)
  const count = directions.length
  const indexAt = (slot: number) => ((slot % count) + count) % count
  const selected = indexAt(center)
  const advance = (delta: number) => setCenter(slot => slot + delta)
  const choose = (index: number) => advance(indexAt(index - selected + count / 2) - count / 2)
  const position = center - drag / (step * .9)
  const [width, setWidth] = useState(window.innerWidth)
  const radius = Math.ceil(width / (2 * step * .9)) + 3

  useEffect(() => {
    const element = stage.current
    if (!element) return
    // Resolve the offset in pixels: older Safari need not multiply typed values inside calc().
    const measure = () => {
      setWidth(element.clientWidth)
      setStep(window.innerWidth <= 700 ? 208 : Math.max(170, Math.min(280, window.innerWidth * .21)))
    }
    measure()
    window.addEventListener('resize', measure)
    let offset = 0
    let settleTimer: ReturnType<typeof setTimeout>
    const wheel = (event: WheelEvent) => {
      // Never steal vertical page scrolling or a trackpad pinch-to-zoom.
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.2 || !event.deltaX) return
      if (event.cancelable) event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1
      offset -= event.deltaX * unit
      setDragging(true)
      setDrag(offset)
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        const delta = Math.round(-offset / (step * .9))
        setCenter(slot => slot + delta)
        offset = 0
        setDrag(0)
        setDragging(false)
      }, 200)
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => { clearTimeout(settleTimer); window.removeEventListener('resize', measure); element.removeEventListener('wheel', wheel) }
  }, [step])

  useEffect(() => {
    if (stage.current?.contains(document.activeElement) && document.activeElement?.closest('[aria-hidden="true"]')) {
      stage.current.focus({ preventScroll: true })
    }
  }, [selected])

  function start(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId, horizontal: false }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.horizontal && Math.abs(dy) > Math.abs(dx) + 8) { suppressClick.current = true; gesture.current = null; return }
    if (Math.abs(dx) > 8 && !current.horizontal) {
      current.horizontal = true
      suppressClick.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    if (current.horizontal) setDrag(dx)
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    // Use the final pointer coordinates, not a potentially stale React render.
    const dx = event.clientX - current.x
    if (current.horizontal) advance(Math.round(-dx / (step * .9)))
    gesture.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDrag(0)
    setDragging(false)
  }

  function cancel() {
    if (!gesture.current) return
    suppressClick.current = true
    gesture.current = null
    setDrag(0)
    setDragging(false)
  }

  const current = directions[selected]
  return <section id="directions" className="directions section">
    <div className="container directions-heading" data-reveal>
      <div><p className="section-kicker">Рядом на каждом этапе</p><h2><span className="desktop-copy">У каждой истории<br />свой первый шаг.</span><span className="mobile-copy">Направления<br />клиники.</span></h2></div>
      <div className="directions-controls">
        <span className="counter" aria-hidden="true">0{selected + 1}<span> / 0{count}</span></span>
        <button className="icon-button" onClick={() => advance(-1)} aria-label="Предыдущее направление"><ArrowLeft /></button>
        <button className="icon-button" onClick={() => advance(1)} aria-label="Следующее направление"><ArrowRight /></button>
      </div>
    </div>

    <div ref={stage} className={`fan-stage ${dragging ? 'is-dragging' : ''}`} role="region" aria-roledescription="карусель" aria-label="Направления клиники. Используйте стрелки для переключения." tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); advance(-1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); advance(1) }
        if (event.key === 'Home') { event.preventDefault(); choose(0) }
        if (event.key === 'End') { event.preventDefault(); choose(count - 1) }
      }} onPointerDown={start} onPointerMove={move} onPointerUp={end}
      onPointerCancel={cancel} onLostPointerCapture={event => { if (event.target === event.currentTarget) cancel() }} onDragStart={event => event.preventDefault()}
      onClickCapture={event => {
        if (event.detail > 0 && suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false }
      }}>
      <ul className="fan-list">
        {Array.from({ length: 2 * radius + 1 }, (_, offset) => {
          const slot = Math.round(position) - radius + offset
          const index = indexAt(slot)
          const direction = directions[index]
          const distance = slot - position
          const absolute = Math.abs(distance)
          const cardStyle = {
            '--card-x': `${distance * step * .9}px`,
            '--card-y': `${absolute ** 1.6 * 19}px`,
            '--card-rotate': `${distance * 9}deg`,
            '--card-scale': 1 - absolute * 0.055,
            zIndex: 100 - Math.round(absolute * 10),
          } as CSSProperties
          return <li key={slot} data-direction-index={index} className={`direction-card ${slot === center ? 'is-current' : ''}`} style={cardStyle} aria-hidden={absolute > 2.5}>
            <img src={media(direction.id as MediaSlot).src} alt="" width={450} height={675} loading="lazy" draggable={false} />
            <span className="direction-label">{direction.name}</span>
            <span className="direction-select" aria-hidden="true"><ArrowUpRight /></span>
            <div className="direction-card-bottom"><span>{direction.tag}</span><p>{direction.note}</p></div>
            <button type="button" className="direction-hitarea" aria-label={index === selected ? `${direction.name}. Следующее направление` : `Выбрать: ${direction.name}`} aria-pressed={index === selected} tabIndex={absolute > 2.5 ? -1 : 0} onClick={() => index === selected ? advance(1) : setCenter(slot)} />
          </li>
        })}
      </ul>
    </div>

    <div className="container">
      <p className="fan-hint">Нажмите на карточку или листайте в сторону</p>
      <label className="direction-picker">Выберите направление<select value={selected} onChange={event => choose(Number(event.target.value))}>{directions.map((direction, index) => <option key={direction.id} value={index}>{direction.name}</option>)}</select></label>
      <div className="direction-detail" aria-live="polite" aria-atomic="true">
        <div><span className="mini-label">Выбранное направление</span><h3>{current.name}</h3></div>
        <p>{current.detail}</p>
        <a className="text-link" href="#contact">Уточнить приём <ArrowUpRight /></a>
      </div>
      <div className="direction-index" aria-label="Выбор направления">
        {directions.map((direction, index) => <button key={direction.id} onClick={() => choose(index)} aria-pressed={index === selected}>{direction.name}</button>)}
      </div>
    </div>
  </section>
}
