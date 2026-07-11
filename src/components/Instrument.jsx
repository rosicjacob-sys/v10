import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import { useReveal } from '../lib/reveal'

// Zone 3 — "The Instrument": the camera dollies INTO the field (choreography),
// so this zone stays sparse and lets the point-tunnel be the moment.
const SPECS = [
  ['DETECTOR', 'RP-HPLC · UV 220 NM'],
  ['IDENTITY', 'ESI-MS · POSITIVE MODE'],
  ['ACQUISITION', '20 HZ · BASELINE-SUBTRACTED'],
  ['ARCHIVE', 'ONE READOUT PER LOT'],
]

export default function Instrument() {
  const scope = useReveal((el) =>
    gsap.from(el.querySelectorAll('[data-reveal]'), {
      y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 70%', once: true },
    })
  )
  return (
    <section id="instrument" className="apex-section instrument" ref={scope}>
      <div className="container apex-cabin instrument-inner">
        <p className="eyebrow" data-reveal>INSIDE THE DETECTOR</p>
        <SplitHeading as="h2" className="section-title" types="lines">
          Look <em>through</em> the instrument.
        </SplitHeading>
        <ul className="spec-grid" data-reveal>
          {SPECS.map(([k, v]) => (
            <li className="spec-row" key={k}>
              <span className="mono-label spec-k">{k}</span>
              <span className="mono-label spec-v">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
