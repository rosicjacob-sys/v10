import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import ApexField from './ApexField'
import { apexStore } from './apexStore'

// The refraction lens — a convex disc of the compound's own light that the
// crystallized peak is read THROUGH. Only mounts on desktop; frozen (not
// animated) under reduced motion. Absorption is tinted to the live accent.
function RefractionLens({ reduced }) {
  const ref = useRef(null)
  const mat = useRef(null)
  useFrame((state, delta) => {
    if (document.hidden && !window.__QA__) return
    const s = apexStore
    const g = ref.current
    if (!g) return
    const show = s.lens > 0.01
    g.visible = show
    if (!show) return
    const k = s.lens
    g.scale.setScalar(THREE.MathUtils.lerp(1.2, 2.8, k))
    g.position.set(s.camX, s.camY * 0.4, 4.2)
    if (!reduced) g.rotation.z = state.clock.elapsedTime * 0.06
    if (mat.current) {
      mat.current.attenuationColor = s.accent
      mat.current.color = s.accent
    }
  })
  return (
    <mesh ref={ref} visible={false} scale={1.2}>
      {/* a flattened icosphere reads as a convex lens/droplet */}
      <sphereGeometry args={[1, 48, 48]} />
      <MeshTransmissionMaterial
        ref={mat}
        transmission={1}
        thickness={1.4}
        roughness={0.06}
        ior={1.47}
        chromaticAberration={0.55}
        anisotropy={0.3}
        distortion={0.35}
        distortionScale={0.4}
        temporalDistortion={reduced ? 0 : 0.12}
        samples={6}
        resolution={512}
        backside={false}
        attenuationDistance={2.4}
        attenuationColor="#2E9BE6"
        color="#2E9BE6"
      />
    </mesh>
  )
}

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
    cam.rotation.z = s.camRoll + p.x * 0.01
    look.set(s.camX + p.x * 0.2, s.camY * 0.4, 0)
    cam.lookAt(look)
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

  return (
    <>
      <ApexField mobile={mobile} reduced={reduced} />
      {!mobile && <RefractionLens reduced={reduced} />}
    </>
  )
}
