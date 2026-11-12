import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import { directions } from './data'
import { media } from './media'
import type { MediaSlot } from './media'

// Arc/rotation vocabulary adapted from the user's DENTIS fan-carousel.js.
// No cloned focus targets, autoplay, perpetual frame loop, or hidden unique copy.
export default function DirectionFan() {
  const [selected, setSelected] = useState(0)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(208)
  const stage = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)
  const gesture = useRef<{ x: number; y: number; id: number; horizontal: boolean } | null>(null)
  const count = directions.length
  const choose = (index: number) => setSelected((index + count) % count)
  const advance = (delta: number) => setSelected(index => (index + delta + count) % count)

  useEffect(() => {
    const element = stage.current
    if (!element) return
    // Resolve the offset in pixels: older Safari need not multiply typed values inside calc().
    const measure = () => setStep(window.innerWidth <= 700 ? 208 : Math.max(170, Math.min(280, window.innerWidth * .21)))
    measure()
    window.addEventListener('resize', measure)
    let last = 0
    let direction = 0
    let accumulated = 0
    let blockedUntil = 0
    const wheel = (event: WheelEvent) => {
      // Never steal vertical page scrolling or a trackpad pinch-to-zoom.
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.2 || !event.deltaX) return
      if (event.cancelable) event.preventDefault()
      const now = performance.now()
      const sign = Math.sign(event.deltaX)
      if (now - last > 180 || sign !== direction) { accumulated = 0; blockedUntil = 0 }
      last = now
      direction = sign
      // Bound the lock to one card's settling time, not the entire wheel stream.
      // Continued scrolling must work even when the pointer never moves.
      if (now < blockedUntil) return
      accumulated += event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1)
      if (Math.abs(accumulated) >= 36) {
        setSelected(index => (index + sign + count) % count)
        accumulated = 0
        blockedUntil = now + 520 // Discard the immediate tail, then allow sustained input again.
      }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => { window.removeEventListener('resize', measure); element.removeEventListener('wheel', wheel) }
  }, [count])

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
    if (current.horizontal) setDrag(Math.max(-220, Math.min(220, dx)))
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    // Use the final pointer coordinates, not a potentially stale React render.
    const dx = event.clientX - current.x
    if (current.horizontal && Math.abs(dx) > 45) advance(dx > 0 ? -1 : 1)
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
        {directions.map((direction, index) => {
          const distance = ((index - selected + count + count / 2) % count) - count / 2
          const absolute = Math.abs(distance)
          const cardStyle = {
            '--card-x': `${distance * step * .9 + drag}px`,
            '--card-y': `${absolute ** 1.6 * 19}px`,
            '--card-rotate': `${distance * 9}deg`,
            '--card-scale': 1 - absolute * 0.055,
            zIndex: 10 - absolute,
          } as CSSProperties
          return <li key={direction.id} className={`direction-card ${index === selected ? 'is-current' : ''}`} style={cardStyle} aria-hidden={absolute > 2}>
            <img src={media(direction.id as MediaSlot).src} alt="" width={450} height={675} loading="lazy" draggable={false} />
            <span className="direction-label">{direction.name}</span>
            <span className="direction-select" aria-hidden="true"><ArrowUpRight /></span>
            <div className="direction-card-bottom"><span>{direction.tag}</span><p>{direction.note}</p></div>
            <button type="button" className="direction-hitarea" aria-label={index === selected ? `${direction.name}. Следующее направление` : `Выбрать: ${direction.name}`} aria-pressed={index === selected} tabIndex={absolute > 2 ? -1 : 0} onClick={() => index === selected ? advance(1) : choose(index)} />
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
