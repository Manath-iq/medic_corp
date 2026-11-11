import { useRef, useState } from 'react'
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
  const gesture = useRef<{ x: number; y: number; id: number; horizontal: boolean } | null>(null)
  const count = directions.length
  const choose = (index: number) => setSelected((index + count) % count)

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button,a')) return
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId, horizontal: false }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.horizontal && Math.abs(dy) > Math.abs(dx) + 8) { gesture.current = null; return }
    if (Math.abs(dx) > 8 && !current.horizontal) {
      current.horizontal = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    if (current.horizontal) setDrag(Math.max(-220, Math.min(220, dx)))
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (!gesture.current || gesture.current.id !== event.pointerId) return
    if (drag > 45) choose(selected - 1)
    if (drag < -45) choose(selected + 1)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    gesture.current = null
    setDrag(0)
    setDragging(false)
  }

  const current = directions[selected]
  return <section id="directions" className="directions section">
    <div className="container directions-heading" data-reveal>
      <div><p className="section-kicker">Рядом на каждом этапе</p><h2>У каждой истории<br />свой первый шаг.</h2></div>
      <div className="directions-controls">
        <span className="counter" aria-hidden="true">0{selected + 1}<span> / 0{count}</span></span>
        <button className="icon-button" onClick={() => choose(selected - 1)} aria-label="Предыдущее направление"><ArrowLeft /></button>
        <button className="icon-button" onClick={() => choose(selected + 1)} aria-label="Следующее направление"><ArrowRight /></button>
      </div>
    </div>

    <div className={`fan-stage ${dragging ? 'is-dragging' : ''}`} role="region" aria-label="Направления клиники. Используйте стрелки для переключения." tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); choose(selected - 1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); choose(selected + 1) }
      }} onPointerDown={start} onPointerMove={move} onPointerUp={end}
      onPointerCancel={() => { gesture.current = null; setDrag(0); setDragging(false) }}>
      <ul className="fan-list">
        {directions.map((direction, index) => {
          const distance = ((index - selected + count + count / 2) % count) - count / 2
          const absolute = Math.abs(distance)
          const cardStyle = {
            '--distance': distance,
            '--card-y': `${absolute ** 1.6 * 19}px`,
            '--card-rotate': `${distance * 9}deg`,
            '--card-scale': 1 - absolute * 0.055,
            '--drag-x': `${drag}px`,
            zIndex: 10 - absolute,
          } as CSSProperties
          return <li key={direction.id} className={`direction-card ${index === selected ? 'is-current' : ''}`} style={cardStyle} aria-hidden={absolute > 2}>
            <img src={media(direction.id as MediaSlot).src} alt="" width={450} height={675} loading="lazy" draggable={false} />
            <span className="direction-label">{direction.name}</span>
            <button className="direction-select" aria-label={`Выбрать: ${direction.name}`} aria-pressed={index === selected} tabIndex={absolute > 2 ? -1 : 0} onClick={() => choose(index)}><ArrowUpRight /></button>
            <div className="direction-card-bottom"><span>{direction.tag}</span><p>{direction.note}</p></div>
          </li>
        })}
      </ul>
    </div>

    <div className="container">
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
