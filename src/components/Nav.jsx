import { useEffect, useRef, useState } from 'react'
import { useCart } from '../lib/cart'
import { scrollToEl } from '../lib/scroll'

const LINKS = [
  { label: 'Catalog', target: '#catalog' },
  { label: 'Compounds', target: '#ghk' },
  { label: 'Verify', target: '#verify' },
  { label: 'FAQ', target: '#faq' },
]

// APEXION mark — a resolved chromatogram peak on a baseline.
export function VialGlyph({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M3 24h6l3.5-16 3.5 16 4-9 2.5 9H29" stroke="var(--accent, #2E9BE6)" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
      <line x1="3" y1="27.5" x2="29" y2="27.5" stroke="#3a4a5c" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Nav() {
  const { count } = useCart()
  const [hidden, setHidden] = useState(false)
  const [glassy, setGlassy] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const openRef = useRef(false)
  openRef.current = open

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setGlassy(y > 24)
      if (openRef.current) setHidden(false)
      else if (y > lastY.current + 6 && y > 180) setHidden(true)
      else if (y < lastY.current - 6 || y < 180) setHidden(false)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const go = (e, target) => {
    e.preventDefault()
    setOpen(false)
    scrollToEl(target)
  }

  return (
    <header className={`nav ${glassy ? 'nav-glass' : ''} ${hidden ? 'nav-hidden' : ''}`}>
      <div className="nav-inner">
        <a className="nav-logo" href="#hero" aria-label="APEXION — home" onClick={(e) => go(e, '#hero')}>
          <VialGlyph />
          <span className="nav-wordmark">APEXION<span className="nav-word2">read the peak</span></span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.target} href={l.target} onClick={(e) => go(e, l.target)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="nav-cta" onClick={() => scrollToEl('#catalog')}>
            Browse catalog
          </button>
          <button
            className="nav-cart"
            aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            onClick={() => {
              setOpen(false)
              scrollToEl('#order')
            }}
          >
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M5.5 8.5h13l-1 11h-11z" strokeLinejoin="round" />
              <path d="M8.8 8.2a3.2 3.2 0 0 1 6.4 0" strokeLinecap="round" />
            </svg>
            {count > 0 && (
              <span key={count} className="cart-badge" aria-hidden="true">
                {count}
              </span>
            )}
          </button>
          <button
            className={`nav-burger ${open ? 'is-open' : ''}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <div id="mobile-menu" className={`nav-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.target} href={l.target} tabIndex={open ? 0 : -1} onClick={(e) => go(e, l.target)}>
            {l.label}
          </a>
        ))}
        <a href="#order" className="nav-menu-cta" tabIndex={open ? 0 : -1} onClick={(e) => go(e, '#order')}>
          Open a lab account
        </a>
      </div>
    </header>
  )
}
