import { Component, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import ApexScene from './ApexScene'
import { useApexChoreography } from './choreography'
import { apexStore } from './apexStore'
import { FORCE_QA, FORCE_REDUCED_MOTION, MOBILE_MQ, useMediaQuery, webglSupported } from '../lib/env'

if (FORCE_QA) window.__QA__ = true

class GLErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) {
    console.warn('[apex] WebGL scene failed — static readout fallback shown.', err)
    if (this.props.onFail) this.props.onFail()
  }
  render() { return this.state.failed ? null : this.props.children }
}

/** Never-blank fallback: a static instrument readout — tick-grid baseline with
 *  one resolved peak, in the live accent. Rendered under the canvas at all times
 *  so the very first frame is the dark faceplate, never a white flash. */
function FallbackReadout({ show }) {
  const rows = Array.from({ length: 9 }, (_, i) => 12 + i * 20)
  const cols = Array.from({ length: 13 }, (_, i) => 10 + i * 15)
  // a chromatogram polyline: flat baseline + one tall gaussian + two minor
  const pts = []
  for (let x = 0; x <= 200; x += 2) {
    const g = 66 * Math.exp(-Math.pow((x - 118) / 11, 2))
    const m1 = 16 * Math.exp(-Math.pow((x - 58) / 8, 2))
    const m2 = 11 * Math.exp(-Math.pow((x - 165) / 9, 2))
    pts.push(`${x},${172 - (g + m1 + m2)}`)
  }
  return (
    <div className="apex-fallback" aria-hidden="true">
      <div className={`af-inner ${show ? '' : 'af-hidden'}`}>
        <svg className="af-svg" viewBox="0 0 200 184" preserveAspectRatio="xMidYMid meet">
          <g stroke="var(--line)" strokeWidth="0.4">
            {rows.map((y) => <line key={`r${y}`} x1="6" y1={y} x2="194" y2={y} />)}
            {cols.map((x) => <line key={`c${x}`} x1={x} y1="12" x2={x} y2="172" />)}
          </g>
          <line x1="6" y1="172" x2="194" y2="172" stroke="var(--ink-soft)" strokeWidth="0.7" />
          <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="118" cy="106" r="2.4" fill="var(--accent)" />
        </svg>
        <div className="af-sheen" />
      </div>
    </div>
  )
}

export default function ApexStage() {
  const [glOk] = useState(() => webglSupported())
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [sized, setSized] = useState(false)
  const stageRef = useRef(null)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)', FORCE_REDUCED_MOTION)
  const mobile = useMediaQuery(MOBILE_MQ)

  useApexChoreography()

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    if (el.clientWidth > 0) { setSized(true); return }
    let ro = null, timer = null
    const check = () => {
      if (el.clientWidth > 0) { setSized(true); if (ro) ro.disconnect(); clearInterval(timer) }
    }
    ro = new ResizeObserver(check); ro.observe(el)
    timer = setInterval(check, 700)
    return () => { ro.disconnect(); clearInterval(timer) }
  }, [])

  // R3F initializes only after react-use-measure reports a non-zero size, which
  // it does on a window 'resize'. In a backgrounded tab the ResizeObserver is
  // frozen — nudge it with a few wall-clock resize dispatches (also fixes QA).
  useEffect(() => {
    if (!sized) return
    const t = [80, 300, 900].map((ms) =>
      setTimeout(() => window.dispatchEvent(new Event('resize')), ms)
    )
    return () => t.forEach(clearTimeout)
  }, [sized])

  const showGL = glOk && !failed
  return (
    <>
      <FallbackReadout show={!showGL || !ready} />
      <div ref={stageRef} className="vial-stage" aria-hidden="true">
        {showGL && sized && (
          <GLErrorBoundary onFail={() => setFailed(true)}>
            <Canvas
              dpr={mobile ? [1, 1.5] : [1, 2]}
              frameloop={reduced ? 'demand' : 'always'}
              camera={{ fov: 40, position: [0, 0, 15], near: 0.1, far: 120 }}
              gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
              onCreated={(state) => {
                state.gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setFailed(true) })
                window.__apex = {
                  set: (vals) => Object.assign(apexStore, vals),
                  advance: () => state.advance(performance.now() / 1000),
                  store: apexStore,
                }
                requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
              }}
            >
              <ApexScene reduced={reduced} mobile={mobile} />
            </Canvas>
          </GLErrorBoundary>
        )}
      </div>
    </>
  )
}
