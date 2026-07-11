import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import Counter from './Counter'
import { useReveal } from '../lib/reveal'
import { PEPTIDES } from '../lib/data'

// Zones 5-7 — the three focus compounds. Each is its OWN tall zone with an id
// the choreography keys on: the field re-sorts into that compound's structure
// (lattice / ring / folded chain) and the signal recolors to its accent.
const IDS = ['ghk', 'amino', 'reta']
const STRUCT = [
  'COORDINATION LATTICE',
  'AROMATIC RING CLUSTER',
  'FOLDED PEPTIDE CHAIN',
]

function Focus({ p, id, struct, index }) {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 68%', once: true },
    })
  )
  const side = index % 2 === 0 ? 'left' : 'right'
  return (
    <section id={id} className={`apex-section focus focus-${side}`} ref={scope} style={{ '--pep': p.ui }}>
      <div className="container">
        <div className="apex-cabin focus-card">
          <p className="eyebrow focus-eyebrow" data-reveal>
            <span className="focus-index mono-label">0{index + 1}</span> {struct}
          </p>
          <SplitHeading as="h2" className="focus-name" types="chars">
            {p.name}
          </SplitHeading>
          <p className="focus-tag mono-label" data-reveal>{p.tag} · {p.dose}{p.unit}</p>
          <p className="focus-blurb" data-reveal>{p.blurb}</p>
          <div className="focus-readout" data-reveal>
            <div className="ro-cell">
              <Counter value={p.purity} suffix="%" decimals={1} className="ro-num" />
              <span className="mono-label">HPLC PURITY</span>
            </div>
            <div className="ro-cell">
              <span className="ro-num mono">{p.rt}</span>
              <span className="mono-label">RT (MIN)</span>
            </div>
            <div className="ro-cell">
              <span className="ro-num mono">{p.mass.replace(' g/mol', '')}</span>
              <span className="mono-label">MASS (G/MOL)</span>
            </div>
          </div>
          <p className="focus-formula mono" data-reveal>{p.formula}</p>
          <p className="focus-ruo mono-label" data-reveal>
            FOR LABORATORY RESEARCH USE ONLY — NOT FOR HUMAN OR VETERINARY USE
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Compounds() {
  return (
    <>
      {PEPTIDES.map((p, i) => (
        <Focus key={p.id} p={p} id={IDS[i]} struct={STRUCT[i]} index={i} />
      ))}
    </>
  )
}
