import { useMemo } from 'react'
import { mulberry32 } from '../three/utils'

/**
 * Deterministic HPLC chromatogram trace: baseline noise, a few minor peaks,
 * one dominant main peak labeled with the assay purity. Parents draw the
 * `[pathLength]` path via the shared reveal pattern (dashoffset), so a failed
 * trigger still leaves a visible chart (stroke present, just not animated).
 */
export default function Chromatogram({ purity, seed = 7, w = 150, h = 42, labeled = true }) {
  const { d, peakX } = useMemo(() => {
    const rnd = mulberry32(20260700 + seed)
    const pts = []
    const n = 60
    const peakAt = 0.62
    const minor = [0.18 + rnd() * 0.08, 0.36 + rnd() * 0.06, 0.82 + rnd() * 0.06]
    for (let i = 0; i <= n; i++) {
      const x = i / n
      let y = 0.06 + rnd() * 0.035 // baseline noise
      for (const m of minor) y += Math.exp(-Math.pow((x - m) / 0.018, 2)) * (0.1 + rnd() * 0.08)
      y += Math.exp(-Math.pow((x - peakAt) / 0.02, 2)) * 0.82
      pts.push(`${(x * w).toFixed(1)},${(h - y * h).toFixed(1)}`)
    }
    return { d: `M${pts.join(' L')}`, peakX: peakAt * w }
  }, [seed, w, h])

  return (
    <svg className="chroma" viewBox={`0 0 ${w} ${h + (labeled ? 10 : 0)}`} aria-hidden="true">
      <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <path d={d} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
      {labeled && (
        <text x={peakX} y={h + 9} textAnchor="middle" fontSize="7.5" fontFamily="var(--font-mono)" fill="currentColor" opacity="0.75">
          {purity}%
        </text>
      )}
    </svg>
  )
}
