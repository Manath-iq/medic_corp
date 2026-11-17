import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, List, Phone, X } from '@phosphor-icons/react'
import { asset, clinic } from './data'
import { specialistsHref } from './specialist-links'

const nav = [['#offers', 'Акции'], ['#directions', 'Услуги'], ['#prices', 'Цены'], [specialistsHref, 'Специалисты'], ['#location', 'Контакты']]

export default function SiteHeader({ home = '' }: { home?: string }) {
  const root = useRef<HTMLElement>(null)
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

  return <header ref={root} className="site-header">
      <div className="nav-bar">
        <a href={home + '#main'} className="brand" aria-label="Клиника семейной медицины, на главную">
          <span className="brand-symbol"><img src={asset('logo-small.webp')} alt="КСМ" width={156} height={156} /></span>
          <span>Клиника<br />семейной медицины</span>
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">{nav.map(([href, label]) => <a key={href} href={href.startsWith('#') ? home + href : href}>{label}</a>)}</nav>
        <div className="nav-actions"><a className="nav-phone" href={clinic.phoneHref}>{clinic.phone}</a><a className="button button-primary button-small" href={home + '#contact'}>Первый приём <ArrowUpRight /></a><button ref={menuButton} className="menu-toggle icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>{menuOpen ? <X /> : <List />}</button></div>
      </div>
      {menuOpen && <nav ref={mobileNav} id="mobile-nav" className="mobile-nav" aria-label="Мобильная навигация">{nav.map(([href, label]) => <a key={href} href={href.startsWith('#') ? home + href : href} onClick={() => {
        setMenuOpen(false)
        // Keep keyboard navigation at the chosen section after removing its link.
        if (home || !href.startsWith('#')) return
        const section = document.querySelector<HTMLElement>(href)
        if (section) { section.tabIndex = -1; section.focus({ preventScroll: true }) }
      }}>{label}<ArrowUpRight /></a>)}<a href={clinic.phoneHref}>{clinic.phone}<Phone /></a></nav>}
    </header>
}
