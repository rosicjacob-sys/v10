import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'
import { PEPTIDES } from '../lib/data'

// Zone 8 — mass-spec fingerprint. The field re-sorts into discrete m/z bars;
// the copy reads the fingerprint out in mono.
export default function MassSpec() {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 70%', once: true },
    })
  )
  return (
    <section id="massspec" className="apex-section massspec" ref={scope}>
      <div className="container apex-cabin">
        <p className="eyebrow" data-reveal>MASS FINGERPRINT · ESI-MS</p>
        <SplitHeading as="h2" className="section-title" types="lines">
          Every compound has a <em>signature</em> in mass.
        </SplitHeading>
        <p className="apex-lead" data-reveal>
          Identity isn’t a label — it’s a pattern of masses. Each lot is confirmed against its
          expected molecular ion before it is cleared. The bars behind this text are that pattern,
          re-sorted from the same points that drew the peak.
        </p>
        <ul className="mz-list" data-reveal>
          {PEPTIDES.map((p) => (
            <li className="mz-row" key={p.id} style={{ '--pep': p.ui }}>
              <span className="mono-label mz-name">{p.name}</span>
              <span className="mono mz-mass">m/z {p.mass.replace(' g/mol', '')}</span>
              <span className="mono-label mz-mode">[M+H]⁺ · CONFIRMED</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
