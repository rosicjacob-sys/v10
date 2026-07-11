import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'

// Zone 4 — the refraction lens set-piece (the screenshot moment). The WebGL
// lens rises over the crystallized peak (choreography sets apexStore.lens 0→1),
// so the copy sits to one side and names what you're seeing.
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
          <p className="eyebrow" data-reveal>READ THROUGH THE MATERIAL</p>
          <SplitHeading as="h2" className="section-title" types="lines">
            The peak, read through the <em>compound</em>.
          </SplitHeading>
          <p className="apex-lead" data-reveal>
            You are not looking at the compound. You are looking <em>through</em> it — the resolved
            signal seen through a lens of its own light, its edge splitting into a thin spectral
            fringe. Each reference standard bends the light a little differently. That is its
            fingerprint.
          </p>
          <p className="apex-note mono-label" data-reveal>
            ITALICS: TRANSMISSION · IOR 1.47 · DISPERSION KEYED TO SCROLL VELOCITY
          </p>
        </div>
      </div>
    </section>
  )
}
