import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'

// Zone 2 — the thesis, set in kinetic display type over the resolved peak.
export default function Thesis() {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 72%', once: true },
    })
  )
  return (
    <section id="thesis" className="apex-section thesis" ref={scope}>
      <div className="container apex-cabin">
        <p className="eyebrow" data-reveal>SIGNAL FROM NOISE</p>
        <SplitHeading as="h2" className="section-title" types="lines">
          We don’t describe purity. We show you the <em>peak</em>.
        </SplitHeading>
        <p className="apex-lead" data-reveal>
          Everything you scroll through is the instrument’s own output — static resolving into a
          single measured signal. A compound is not a picture or a promise here. It is a peak,
          rising cleanly out of the baseline, and the number under it is the number the detector
          returned.
        </p>
        <p className="apex-note mono-label" data-reveal>
          DETECTED · CHARACTERIZED · ARCHIVED — FOR LABORATORY RESEARCH USE ONLY
        </p>
      </div>
    </section>
  )
}
