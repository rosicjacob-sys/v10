import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import Magnetic from './Magnetic'
import { useReveal } from '../lib/reveal'
import { scrollToEl, scrollState } from '../lib/scroll'
import { coarsePointer, reducedMotion } from '../lib/env'

export default function Hero() {
  const titleRef = useRef(null)
  // scroll-velocity-reactive display width: the headline breathes wider with
  // scroll speed (capped), snaps back with the smoothed velocity.
  useEffect(() => {
    if (reducedMotion() || coarsePointer()) return
    let w = 112
    const tick = () => {
      const el = titleRef.current && titleRef.current.querySelector('h1')
      if (!el) return
      const target = Math.min(112 + Math.abs(scrollState.velocity) * 3.0, 125)
      w += (target - w) * 0.12
      el.style.fontVariationSettings = `'wdth' ${w.toFixed(2)}`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 26,
      autoAlpha: 0,
      duration: 0.95,
      ease: 'power3.out',
      stagger: 0.09,
      delay: 0.45,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  )
  return (
    <section id="hero" className="hero" ref={scope}>
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow" data-reveal>
            DETECTED · CHARACTERIZED · ARCHIVED
          </p>
          <div ref={titleRef}>
            <SplitHeading as="h1" className="hero-title">
              Every peak, resolved to <em>baseline</em>.
            </SplitHeading>
          </div>
          <p className="hero-sub" data-reveal>
            Research-grade reference compounds, characterized by HPLC and mass — and shown to you as
            the instrument sees them: a signal resolving out of detector noise. For laboratory
            research use only.
          </p>
          <div className="hero-ctas" data-reveal>
            <Magnetic>
              <button
                className="btn"
                onClick={() => scrollToEl('#catalog')}
              >
                Browse the catalog
              </button>
            </Magnetic>
            <Magnetic strength={0.22}>
              <a
                className="btn-ghost"
                href="#verify"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToEl('#verify')
                }}
              >
                How we verify
              </a>
            </Magnetic>
          </div>
          <ul className="trust-row mono-label" data-reveal>
            <li>≥99% BY HPLC</li>
            <li>MASS-CONFIRMED</li>
            <li>RESEARCH USE ONLY</li>
          </ul>
        </div>
        <div className="hero-stage" aria-hidden="true" />
      </div>
    </section>
  )
}
