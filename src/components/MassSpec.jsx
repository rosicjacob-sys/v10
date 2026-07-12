import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import Scramble from './Scramble'
import { useReveal } from '../lib/reveal'
import { PEPTIDES } from '../lib/data'

// Zone 8 — mass-spec fingerprint. Its OWN animated system: an m/z stick
// spectrum whose peaks grow up from the baseline on reveal, plus a sweeping
// acquisition line. The persistent field also re-sorts into m/z bars behind.
const PEAKS = [
  [8, 22], [17, 40], [24, 100], [31, 16], [38, 58], [46, 82],
  [55, 24], [63, 70], [71, 34], [80, 48], [88, 18], [96, 90], [108, 30],
  [120, 44], [131, 62], [140, 12], [152, 26], [165, 54], [178, 20], [190, 38],
]

export default function MassSpec() {
  const scope = useReveal((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 68%', once: true } })
    tl.from(el.querySelectorAll('[data-reveal]'), {
      y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
    }).from(el.querySelectorAll('.mz-stick'), {
      scaleY: 0, transformOrigin: 'bottom', duration: 0.9, ease: 'power3.out', stagger: 0.02,
    }, '<0.1').fromTo(el.querySelector('.mz-sweep'), { attr: { x1: 6, x2: 6 } }, {
      attr: { x1: 194, x2: 194 }, duration: 2.2, ease: 'power1.inOut',
    }, '<')
    return tl
  })
  return (
    <section id="massspec" className="apex-section massspec" ref={scope}>
      <div className="container apex-cabin">
        <p className="eyebrow" data-reveal>MASS FINGERPRINT · ESI-MS</p>
        <SplitHeading as="h2" className="section-title" types="lines">
          Every compound has a <em>signature</em> in mass.
        </SplitHeading>
        <p className="apex-lead" data-reveal>
          Identity isn’t a label — it’s a pattern of masses. Each lot is confirmed against its
          expected molecular ion before it is cleared.
        </p>
        <div className="mz-spectrum" data-reveal aria-hidden="true">
          <svg viewBox="0 0 200 96" preserveAspectRatio="none">
            <line x1="6" y1="86" x2="194" y2="86" stroke="var(--line)" strokeWidth="0.6" />
            {PEAKS.map(([x, h], i) => (
              <line key={i} className="mz-stick" x1={x} y1={86} x2={x} y2={86 - h * 0.74}
                stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" />
            ))}
            <line className="mz-sweep" x1="6" y1="6" x2="6" y2="90" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
          </svg>
          <div className="mz-axis mono-label"><span>0</span><span>m/z</span><span>2000</span></div>
        </div>
        <ul className="mz-list" data-reveal>
          {PEPTIDES.map((p) => (
            <li className="mz-row" key={p.id} style={{ '--pep': p.ui }}>
              <span className="mono-label mz-name">{p.name}</span>
              <Scramble as="span" className="mono mz-mass" text={`m/z ${p.mass.replace(' g/mol', '')}`} />
              <span className="mono-label mz-mode">[M+H]⁺ · CONFIRMED</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
