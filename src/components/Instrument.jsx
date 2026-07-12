import gsap from 'gsap'
import SplitHeading from './SplitHeading'
import Scramble from './Scramble'
import { useReveal } from '../lib/reveal'

// Zone 3 — "The Instrument". The camera dollies INTO the field here (driven by
// the #instrument waypoint in choreography.js via the global scrub — no pin,
// so no layout thrash). Copy holds one side while the field drives through.
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
      <div className="container">
        <div className="apex-cabin instrument-cabin cabin-left">
          <p className="eyebrow" data-reveal>INSIDE THE DETECTOR</p>
          <SplitHeading as="h2" className="section-title" types="lines">
            Look <em>through</em> the instrument.
          </SplitHeading>
          <p className="apex-lead" data-reveal>
            Keep scrolling — the camera drives straight through the resolved signal.
          </p>
          <ul className="spec-grid" data-reveal>
            {SPECS.map(([k, v]) => (
              <li className="spec-row" key={k}>
                <span className="mono-label spec-k">{k}</span>
                <Scramble as="span" className="mono-label spec-v" text={v} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
