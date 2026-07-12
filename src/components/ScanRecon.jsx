import { useRef } from 'react'
import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'

// Zone 9 — scan reconstruction. Its OWN system: a scan line sweeps down a grid
// of points that ignite row-by-row as it passes, while a slice counter climbs.
// (The persistent field also forms a scan sphere with the choreography sweep.)
const COLS = 24
const ROWS = 14

export default function ScanRecon() {
  const pctRef = useRef(null)
  const dots = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // an implied sphere: dot present only inside a radial mask
      const nx = (c / (COLS - 1) - 0.5) * 2
      const ny = (r / (ROWS - 1) - 0.5) * 2
      if (nx * nx + ny * ny * 1.7 < 0.92) dots.push([6 + c * 7.8, 8 + r * 6, r])
    }
  }
  const scope = useReveal((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 68%', once: true } })
    tl.from(el.querySelectorAll('[data-reveal]'), {
      y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
    })
    const line = el.querySelector('.sr-line')
    const counter = { v: 0 }
    tl.fromTo(line, { attr: { y1: 6, y2: 6 } }, { attr: { y1: 92, y2: 92 }, duration: 2.6, ease: 'none' }, '<0.2')
    tl.to(counter, {
      v: 128, duration: 2.6, ease: 'none',
      onUpdate: () => { if (pctRef.current) pctRef.current.textContent = String(Math.round(counter.v)).padStart(3, '0') },
    }, '<')
    // dots ignite by row as the line passes
    ROWS && el.querySelectorAll('.sr-dot').forEach((d) => {
      const row = Number(d.dataset.row)
      tl.fromTo(d, { opacity: 0.12 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.2 + (row / ROWS) * 2.6)
    })
    return tl
  })
  return (
    <section id="scan" className="apex-section scan" ref={scope}>
      <div className="container apex-cabin scan-inner">
        <div className="scan-copy">
          <p className="eyebrow" data-reveal>RECONSTRUCTION · SCAN SWEEP</p>
          <SplitHeading as="h2" className="section-title" types="lines">
            The sample, rebuilt one slice at a time.
          </SplitHeading>
          <p className="apex-lead" data-reveal>
            A scan-plane descends and the volume brightens where it passes — reconstruction, slice
            by slice, the way a detector actually builds an image.
          </p>
          <p className="apex-note mono-label" data-reveal>
            SLICE <span ref={pctRef}>000</span> / 128 · Z-STACK · INTENSITY = SCAN INCIDENCE
          </p>
        </div>
        <div className="scan-panel" data-reveal aria-hidden="true">
          <svg viewBox="0 0 196 98" preserveAspectRatio="xMidYMid meet">
            {dots.map(([x, y, r], i) => (
              <circle key={i} className="sr-dot" data-row={r} cx={x} cy={y} r="1.5" fill="var(--accent)" opacity="0.5" />
            ))}
            <line className="sr-line" x1="4" y1="6" x2="192" y2="6" stroke="var(--accent)" strokeWidth="1" opacity="0.85" />
          </svg>
        </div>
      </div>
    </section>
  )
}
