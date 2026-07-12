import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'

// Zone 4 — the resolved-peak moment. The field crystallizes into its cleanest,
// brightest chromatogram peak here (choreography holds seq at the PEAK slot,
// dim 1); the copy names what the resolved signal means.
export default function Lens() {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 26, autoAlpha: 0, duration: 0.95, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 72%', once: true },
    })
  )
  return (
    <section id="lens" className="apex-section lens" ref={scope}>
      <div className="container lens-grid">
        <div className="apex-cabin lens-copy">
          <p className="eyebrow" data-reveal>RESOLVED TO BASELINE</p>
          <SplitHeading as="h2" className="section-title" types="lines">
            One lot. One <em>peak</em>. One number.
          </SplitHeading>
          <p className="apex-lead" data-reveal>
            When the field goes still, this is what’s left: a single measured signal rising cleanly
            out of the noise, resolved all the way to baseline. No description, no promise — the
            peak the detector actually returned. Every reference standard has exactly one.
          </p>
          <p className="apex-note mono-label" data-reveal>
            PEAK AREA ≥ 99% · BASELINE-RESOLVED · ONE READOUT PER LOT
          </p>
        </div>
      </div>
    </section>
  )
}
