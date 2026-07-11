import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { vialStore } from './vialStore'
import { mulberry32 } from './utils'

/**
 * v2 protagonist: a GPU-morphed point cloud. Every particle carries its four
 * shape targets (cloud/mound/helix/torus) as attributes; blending, helix spin,
 * torus tilt, curl-ish drift, and the rung-reveal cascade all run in the
 * vertex shader — the CPU updates ~12 uniforms per frame and nothing else.
 * Fragment shader fakes sphere shading (lambert + accent rim) on point
 * sprites, with a spotlight-driven glow term for the dark scene.
 */

const VERT = /* glsl */ `
  uniform vec4 uW;          // cloud, mound, helix, torus (normalized)
  uniform float uTime;
  uniform float uReveal;    // rung cascade 0..1
  uniform float uIntro;
  uniform float uSpinH;
  uniform float uSpinT;
  uniform float uScale;     // group world scale (points need it manually)
  uniform float uPR;        // device pixel ratio
  uniform vec3 uColor;
  uniform vec3 uColorDeep;
  uniform float uSpot;

  attribute vec3 aCloud;
  attribute vec3 aMound;
  attribute vec3 aHelix;
  attribute vec3 aTorus;
  attribute float aTier;    // 0 backbone, 1 rung, 2 dust
  attribute float aSize;
  attribute float aPhase;
  attribute float aRungT;   // 0..1 along the helix
  attribute float aSide;    // -1..1 across a rung
  attribute float aLayer;   // 0..4 — which stratum in the stack state
  attribute vec3 aSeed;

  varying vec3 vColor;
  varying float vGlow;
  varying float vTier;

  mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }

  void main() {
    // --- per-shape motion ---
    vec3 cloud = aCloud + vec3(
      sin(uTime * 0.5 * aSeed.x + aPhase) * 0.22,
      sin(uTime * 0.4 * aSeed.y + aPhase * 2.0) * 0.18,
      cos(uTime * 0.45 * aSeed.z + aPhase) * 0.2
    );

    vec3 mound = aMound;
    float layerDir = mod(aLayer, 2.0) * 2.0 - 1.0;
    mound.xz = rot(uTime * 0.12 * layerDir) * mound.xz;
    mound.y += sin(uTime * 0.7 + aLayer * 1.3) * 0.025;

    vec3 helix = aHelix;
    float gate = 1.0;
    if (aTier > 0.5 && aTier < 1.5) {
      gate = clamp(uReveal * 1.35 - aRungT * 0.35, 0.0, 1.0);
      float scatter = 1.0 - gate;
      helix += vec3(sin(aPhase * 7.0), cos(aPhase * 5.0) * 0.7, cos(aPhase * 9.0)) * 0.55 * scatter;
    }
    helix.xz = rot(uSpinH) * helix.xz;

    vec3 torus = aTorus;
    torus.xz = rot(uSpinT) * torus.xz;
    torus.yz = rot(0.55) * torus.yz; // tilt so the ring opening reads

    vec3 pos = cloud * uW.x + mound * uW.y + helix * uW.z + torus * uW.w;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float sizeGate = (aTier > 0.5 && aTier < 1.5) ? (0.55 + 0.45 * gate) : 1.0;
    // dust thins out while the helix is dominant — the structure must read,
    // not drown: 60% of grains vanish, the rest form a wide sparse halo
    float dustFade = 1.0;
    if (aTier > 1.5) {
      float keep = step(0.85, fract(aPhase * 13.0));
      dustFade = mix(1.0, keep * 0.3, uW.z);
    }
    gl_PointSize = aSize * uScale * uPR * sizeGate * dustFade * uIntro * (340.0 / -mv.z);

    // --- tier coloring on the GPU ---
    vec3 silver = vec3(0.78, 0.81, 0.85);
    vec3 silverDeep = vec3(0.45, 0.5, 0.56);
    if (aTier < 0.5) {
      vColor = mix(silver, silverDeep, step(0.5, fract(aRungT * 7.0)) * 0.5 + 0.1);
      vGlow = 0.12;
    } else if (aTier < 1.5) {
      vColor = mix(uColor, uColorDeep, step(0.0, aSide));
      vColor = mix(vColor, vec3(1.0), 0.08);
      vGlow = 0.55 + 0.45 * gate;
    } else {
      vColor = mix(uColor, vec3(1.0), 0.42 + 0.25 * fract(aPhase * 3.7));
      vGlow = 0.18;
    }
    // stack state: geological grading, bottom-dark to top-light, the middle
    // stratum wears the compound's accent
    vec3 strataCol;
    if (aLayer < 0.5)      strataCol = vec3(0.5, 0.54, 0.59);
    else if (aLayer < 1.5) strataCol = vec3(0.65, 0.68, 0.72);
    else if (aLayer < 2.5) strataCol = mix(uColor, vec3(1.0), 0.12);
    else if (aLayer < 3.5) strataCol = vec3(0.78, 0.81, 0.85);
    else                   strataCol = vec3(0.89, 0.91, 0.94);
    vColor = mix(vColor, strataCol, clamp(uW.y * 1.15, 0.0, 1.0));
    vTier = aTier;
  }
`

const FRAG = /* glsl */ `
  uniform float uSpot;
  uniform vec3 uColor;

  varying vec3 vColor;
  varying float vGlow;
  varying float vTier;

  void main() {
    vec2 n2 = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(n2, n2);
    if (r2 > 1.0) discard;
    vec3 n = vec3(n2.x, -n2.y, sqrt(max(1.0 - r2, 0.0)));
    vec3 lightDir = normalize(vec3(0.5, 0.7, 0.6));
    float diff = max(dot(n, lightDir), 0.0) * 1.0 + 0.18;
    float rim = pow(1.0 - n.z, 2.2);
    vec3 col = vColor * diff + uColor * rim * (0.22 + uSpot * 0.5) * vGlow * 2.0;
    // spotlight scene: rungs and rims emit — feeds the bloom pass
    col += vColor * vGlow * uSpot * 0.2;
    float alpha = smoothstep(1.0, 0.78, sqrt(r2));
    gl_FragColor = vec4(col, alpha);
  }
`

export default function StrataParticles({ counts, reduced = false }) {
  const matRef = useRef(null)
  const prevW = useRef(new THREE.Vector4())

  const { geometry, total } = useMemo(() => {
    const rnd = mulberry32(20260711)
    const nBackbone = counts.backbone
    const nRung = counts.rungs * counts.perRung
    const nDust = counts.dust
    const total = nBackbone + nRung + nDust

    const cloud = new Float32Array(total * 3)
    const mound = new Float32Array(total * 3)
    const helix = new Float32Array(total * 3)
    const torus = new Float32Array(total * 3)
    const tier = new Float32Array(total)
    const layer = new Float32Array(total)
    const size = new Float32Array(total)
    const phase = new Float32Array(total)
    const rungT = new Float32Array(total)
    const side = new Float32Array(total)
    const seed = new Float32Array(total * 3)
    const posInit = new Float32Array(total * 3) // required 'position' attribute

    const H = 3.6
    const TURNS = 2.2
    const R = 0.78
    const ang = (t) => Math.PI * 2 * TURNS * t

    let i = 0
    for (let s = 0; s < 2; s++) {
      const per = nBackbone / 2
      for (let k = 0; k < per; k++, i++) {
        const t = k / (per - 1)
        const a = ang(t) + s * Math.PI
        tier[i] = 0
        size[i] = 1.8 + rnd() * 0.35
        rungT[i] = t
        helix[i * 3] = Math.cos(a) * R
        helix[i * 3 + 1] = -H / 2 + t * H
        helix[i * 3 + 2] = Math.sin(a) * R
      }
    }
    for (let r = 0; r < counts.rungs; r++) {
      const t = (r + 0.5) / counts.rungs
      const a = ang(t)
      const y = -H / 2 + t * H
      for (let j = 0; j < counts.perRung; j++, i++) {
        const f = (j / (counts.perRung - 1)) * 2 - 1
        tier[i] = 1
        size[i] = 1.05 + rnd() * 0.2
        rungT[i] = t
        side[i] = f
        helix[i * 3] = Math.cos(a) * R * f
        helix[i * 3 + 1] = y
        helix[i * 3 + 2] = Math.sin(a) * R * f
      }
    }
    for (let d = 0; d < nDust; d++, i++) {
      const t = rnd()
      const a = ang(t) + (rnd() - 0.5) * 2.4
      const rr = 1.3 + rnd() * 0.5
      tier[i] = 2
      size[i] = 0.4 + rnd() * 0.75
      rungT[i] = t
      helix[i * 3] = Math.cos(a) * rr
      helix[i * 3 + 1] = -H / 2 + t * H + (rnd() - 0.5) * 0.35
      helix[i * 3 + 2] = Math.sin(a) * rr
    }

    for (let k = 0; k < total; k++) {
      const g = () => (rnd() + rnd() - 1) * 1.4
      cloud[k * 3] = g() * 1.55
      cloud[k * 3 + 1] = g() * 1.05
      cloud[k * 3 + 2] = g() * 1.15
      // the STRATA stack: five thin floating discs, tapering upward,
      // crisp rims (edge-biased sampling), thin slabs
      const L = Math.floor(rnd() * 5)
      layer[k] = L
      const RADII = [1.28, 1.1, 0.94, 0.8, 0.66]
      const th = rnd() * Math.PI * 2
      let rr2 = Math.sqrt(rnd()) * RADII[L]
      if (rnd() < 0.22) rr2 = RADII[L] * (0.93 + rnd() * 0.07) // rim bias
      mound[k * 3] = Math.cos(th) * rr2
      mound[k * 3 + 1] = -0.86 + L * 0.43 + (rnd() - 0.5) * 0.055
      mound[k * 3 + 2] = Math.sin(th) * rr2
      const u = rnd() * Math.PI * 2
      const v = rnd() * Math.PI * 2
      const ring = 0.88 + 0.27 * Math.cos(v)
      torus[k * 3] = Math.cos(u) * ring
      torus[k * 3 + 1] = 0.27 * Math.sin(v)
      torus[k * 3 + 2] = Math.sin(u) * ring
      phase[k] = rnd() * Math.PI * 2
      seed[k * 3] = 0.5 + rnd()
      seed[k * 3 + 1] = 0.5 + rnd()
      seed[k * 3 + 2] = 0.5 + rnd()
      posInit[k * 3] = cloud[k * 3]
      posInit[k * 3 + 1] = cloud[k * 3 + 1]
      posInit[k * 3 + 2] = cloud[k * 3 + 2]
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posInit, 3))
    geo.setAttribute('aCloud', new THREE.BufferAttribute(cloud, 3))
    geo.setAttribute('aMound', new THREE.BufferAttribute(mound, 3))
    geo.setAttribute('aHelix', new THREE.BufferAttribute(helix, 3))
    geo.setAttribute('aTorus', new THREE.BufferAttribute(torus, 3))
    geo.setAttribute('aTier', new THREE.BufferAttribute(tier, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aRungT', new THREE.BufferAttribute(rungT, 1))
    geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
    geo.setAttribute('aLayer', new THREE.BufferAttribute(layer, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))
    // generous static bounds — targets never leave this sphere
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6)
    return { geometry: geo, total }
  }, [counts])

  const uniforms = useMemo(
    () => ({
      uW: { value: new THREE.Vector4(1, 0, 0, 0) },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uIntro: { value: 0 },
      uSpinH: { value: 0 },
      uSpinT: { value: 0 },
      uScale: { value: 1 },
      uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uColor: { value: new THREE.Color('#1F6FEB') },
      uColorDeep: { value: new THREE.Color('#0B3D91') },
      uSpot: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    if (document.hidden && !window.__QA__) return
    const s = vialStore
    const t = reduced ? 0.9 : state.clock.elapsedTime

    s.color.lerp(s.targetColor, 0.08)
    s.colorDeep.lerp(s.targetDeep, 0.08)

    let wc = Math.max(s.wCloud, 0)
    let wm = Math.max(s.wMound, 0)
    let wh = Math.max(s.wHelix, 0)
    let wt = Math.max(s.wTorus, 0)
    const sum = wc + wm + wh + wt || 1

    const u = uniforms
    u.uW.value.set(wc / sum, wm / sum, wh / sum, wt / sum)
    u.uTime.value = t
    u.uReveal.value = s.rungReveal
    u.uIntro.value = Math.max(s.intro, 0.0001)
    u.uSpinH.value = t * 0.45
    u.uSpinT.value = t * 0.8
    u.uSpot.value = s.spotlight
    u.uColor.value.copy(s.color)
    u.uColorDeep.value.copy(s.colorDeep)
    // uScale is set by the scene (group world scale) via vialStore
    u.uScale.value = s._worldScale || 1
    prevW.current.copy(u.uW.value)
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
