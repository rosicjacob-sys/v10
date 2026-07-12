import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import Scramble from './Scramble'
import { useReveal } from '../lib/reveal'
import { PEPTIDES } from '../lib/data'

// Zone 12 — formula assembly. The field migrates to spell a molecular formula;
// this zone lists each compound's formula in mono as the readout.
export default function Formula() {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 70%', once: true },
    })
  )
  return (
    <section id="formula" className="apex-section formula" ref={scope}>
      <div className="container apex-cabin">
        <p className="eyebrow" data-reveal>COMPOSITION · ASSEMBLED FROM THE FIELD</p>
        <SplitHeading as="h2" className="section-title" types="lines">
          The same points spell the <em>formula</em>.
        </SplitHeading>
        <ul className="formula-list" data-reveal>
          {PEPTIDES.map((p) => (
            <li className="formula-row" key={p.id} style={{ '--pep': p.ui }}>
              <span className="mono-label formula-name">{p.name}</span>
              <Scramble as="span" className="mono formula-value" text={p.formula} speed={34} />
            </li>
          ))}
        </ul>
        <p className="apex-note mono-label" data-reveal>
          NOMINAL COMPOSITION SHOWN · SEE THE COA FOR THE MEASURED VALUES OF EACH LOT
        </p>
      </div>
    </section>
  )
}
