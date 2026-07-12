import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import ApexField from './ApexField'
import { apexStore } from './apexStore'

// NOTE: an earlier build put a drei <MeshTransmissionMaterial> "refraction lens"
// here. On a transparent, additive canvas its transmission sampler reads BLACK,
// so it rendered as a giant opaque black orb that filled the screen at the #lens
// section — the "grey/dark page". Same trap as bloom-on-transparent. Removed:
// the point-field is the hero, and #lens just crystallizes the peak brightly.
// Do NOT reintroduce MeshTransmissionMaterial or postprocessing bloom over this
// transparent canvas.

export default function ApexScene({ reduced, mobile }) {
  const three = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const ptr = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  useEffect(() => {
    if (reduced || mobile) return
    const onMove = (e) => {
      ptr.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      ptr.current.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduced, mobile])

  const apply = (state) => {
    const s = apexStore
    const p = ptr.current
    p.x += (p.tx - p.x) * 0.05
    p.y += (p.ty - p.y) * 0.05
    const cam = state.camera
    cam.position.set(s.camX + p.x * 0.4, s.camY + p.y * 0.3, s.camZ)
    look.set(s.camX + p.x * 0.2, s.camY * 0.4, 0)
    cam.lookAt(look) // rebuilds the quaternion, so roll must be applied AFTER
    const roll = s.camRoll + p.x * 0.01
    if (roll !== 0) cam.rotateZ(roll)
    if (cam.isPerspectiveCamera && Math.abs(cam.fov - s.fov) > 0.01) {
      cam.fov = s.fov
      cam.updateProjectionMatrix()
    }
  }

  useFrame((state) => {
    if (document.hidden && !window.__QA__) return
    apply(state)
  })

  useEffect(() => {
    if (!reduced) return
    apply(three)
    three.invalidate()
    const onSnap = () => { apply(three); three.invalidate() }
    window.addEventListener('apex-color-snap', onSnap)
    return () => window.removeEventListener('apex-color-snap', onSnap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  return <ApexField mobile={mobile} reduced={reduced} />
}
