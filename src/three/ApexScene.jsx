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
  const rim = useRef(null)
  useFrame((state, delta) => {
    if (document.hidden && !window.__QA__) return
    const s = apexStore
    const g = ref.current
    if (!g) return
    const show = s.lens > 0.01
    g.visible = show
    if (!show) return
    const k = s.lens
    const sc = THREE.MathUtils.lerp(0.8, 1.7, k)
    g.scale.set(sc, sc, sc * 0.62) // flattened = convex lens, not a ball
    g.position.set(s.camX + 0.3, s.camY * 0.4 + 0.5, 5.0)
    if (!reduced) g.rotation.z = state.clock.elapsedTime * 0.05
    if (mat.current) {
      mat.current.attenuationColor = s.accent
      mat.current.color = s.accent
    }
    if (rim.current) {
      rim.current.material.color.copy(s.accent)
      rim.current.material.opacity = 0.5 * k
    }
  })
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <sphereGeometry args={[1, 56, 56]} />
        <MeshTransmissionMaterial
          ref={mat}
          transmission={1}
          thickness={0.7}
          roughness={0.12}
          ior={1.32}
          chromaticAberration={0.85}
          anisotropy={0.4}
          distortion={0.25}
          distortionScale={0.3}
          temporalDistortion={reduced ? 0 : 0.1}
          samples={6}
          resolution={512}
          backside={false}
          attenuationDistance={6}
          attenuationColor="#2E9BE6"
          color="#dff0fb"
        />
      </mesh>
      {/* additive spectral rim — always reads, even over dark space */}
      <mesh ref={rim} scale={1.02}>
        <torusGeometry args={[1.0, 0.045, 16, 96]} />
        <meshBasicMaterial color="#2E9BE6" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
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

  return (
    <>
      <ApexField mobile={mobile} reduced={reduced} />
      {!mobile && <RefractionLens reduced={reduced} />}
    </>
  )
}
