import { useRef } from 'react'
import { useMarquee } from '../lib/useMarquee'
import { MARQUEE_WORDS } from '../lib/data'

const SEQ =
  'GLY-HIS-LYS·CU(II) — 403.9 DA · C₁₀H₁₂N₂ — 160.2 DA · YAibEGTFTSDYSIAibLDKIAQKAFVQWLIAGGPSSGAPPPS — 4731 DA · RP-HPLC UV220 · ESI-MS · '

export default function Marquee() {
  const track = useRef(null)
  const seqTrack = useRef(null)
  useMarquee(track, { speed: 84, dir: -1, velocityBoost: true })
  useMarquee(seqTrack, { speed: 30, dir: 1 })
  const run = (key) =>
    MARQUEE_WORDS.map((w, i) => (
      <span className="mk-item" key={`${key}-${i}`}>
        <span className={`mk-word ${i % 2 ? 'mk-outline' : ''}`}>{w}</span>
        <span className="mk-dot" aria-hidden="true" />
      </span>
    ))
  return (
    <div className="marquee" aria-hidden="true">
      <div className="mk-track" ref={track}>
        {run('a')}
        {run('b')}
      </div>
      <div className="mk-seq mono-label" ref={seqTrack}>
        <span>{SEQ.repeat(3)}</span>
        <span>{SEQ.repeat(3)}</span>
      </div>
    </div>
  )
}
