import { DISCLAIMER } from '../lib/data'
import { VialGlyph } from './Nav'
import { scrollToEl } from '../lib/scroll'

const PAYMENTS = ['VISA', 'MC', 'AMEX', 'WIRE']

export default function Footer() {
  const go = (e, t) => {
    e.preventDefault()
    scrollToEl(t)
  }
  return (
    <footer id="site-footer" className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="footer-logo">
            <VialGlyph />
            <span>APEXION</span>
          </p>
          <p className="mono-label">CHARACTERIZED · BATCH-TRACEABLE</p>
          <p className="footer-tag">Every peak, resolved to baseline.</p>
        </div>
        <nav className="footer-col" aria-label="Shop">
          <p className="mono-label footer-head">CATALOG</p>
          <a href="#catalog" onClick={(e) => go(e, '#catalog')}>GHK-Cu 100mg — $46</a>
          <a href="#catalog" onClick={(e) => go(e, '#catalog')}>5-Amino-1MQ 50mg — $64</a>
          <a href="#catalog" onClick={(e) => go(e, '#catalog')}>Retatrutide 20mg — $189</a>
          <a href="#catalog" onClick={(e) => go(e, '#catalog')}>All peptides</a>
        </nav>
        <nav className="footer-col" aria-label="Standards">
          <p className="mono-label footer-head">STANDARDS</p>
          <a href="#verify" onClick={(e) => go(e, '#verify')}>How we verify</a>
          <a href="#reviews" onClick={(e) => go(e, '#reviews')}>COA &amp; batch record</a>
          <a href="#faq" onClick={(e) => go(e, '#faq')}>FAQ + shipping</a>
        </nav>
        <div className="footer-col">
          <p className="mono-label footer-head">CONTACT</p>
          <a href="mailto:lab@apexion.bio">lab@apexion.bio</a>
          <p className="footer-pay" aria-label="Accepted payments: Visa, Mastercard, American Express, wire transfer">
            {PAYMENTS.map((p) => (
              <span className="pay-chip mono-label" key={p}>
                {p}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="container footer-legal">
        <p className="footer-disclaimer">{DISCLAIMER}</p>
        <p className="footer-disclaimer">
          Sales restricted to purchasers 21+ acting on behalf of a laboratory or research
          institution. Handle all compounds with appropriate laboratory controls.
        </p>
        <p className="mono-label footer-copy">© 2026 APEXION INSTRUMENTS LLC · ALL RIGHTS RESERVED</p>
      </div>
    </footer>
  )
}
