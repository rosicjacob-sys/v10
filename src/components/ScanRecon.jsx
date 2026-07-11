import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'

// Zone 9 — scan reconstruction. The field forms a spherical shell and a
// scan-plane (choreography scanSweep) descends through it, brightening the
// points it passes — the cryo/characterization aesthetic.
export default function ScanRecon() {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 70%', once: true },
    })
  )
  return (
    <section id="scan" className="apex-section scan" ref={scope}>
      <div className="container apex-cabin">
        <p className="eyebrow" data-reveal>RECONSTRUCTION · SCAN SWEEP</p>
        <SplitHeading as="h2" className="section-title" types="lines">
          The sample, rebuilt one slice at a time.
        </SplitHeading>
        <p className="apex-lead" data-reveal>
          A scan-plane descends through the field and the volume brightens where it passes —
          reconstruction, slice by slice, the way a detector actually builds an image. Keep
          scrolling to run the sweep.
        </p>
        <p className="apex-note mono-label" data-reveal>
          SLICE PITCH 0.2 MM · Z-STACK 128 · INTENSITY = SCAN INCIDENCE
        </p>
      </div>
    </section>
  )
}
