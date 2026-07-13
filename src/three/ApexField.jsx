import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { apexStore } from './apexStore'
import { bakeTargets, SLOT, SLOT_COUNT } from './apexTargets'

// ---- GLSL: simplex noise 3D + curl (for the "boil") ----
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 curlNoise(vec3 p){
  const float e=0.1; vec3 dx=vec3(e,0.0,0.0),dy=vec3(0.0,e,0.0),dz=vec3(0.0,0.0,e);
  float x0=snoise(p-dx),x1=snoise(p+dx);
  float y0=snoise(p-dy),y1=snoise(p+dy);
  float z0=snoise(p-dz),z1=snoise(p+dz);
  float p_x=snoise(p+vec3(31.4,0.0,0.0));
  vec3 pa=p+vec3(0.0,17.1,0.0), pb=p+vec3(0.0,0.0,23.7);
  float ay0=snoise(pa-dz),ay1=snoise(pa+dz),az0=snoise(pa-dy),az1=snoise(pa+dy);
  float bx0=snoise(pb-dz),bx1=snoise(pb+dz),bz0=snoise(pb-dx),bz1=snoise(pb+dx);
  vec3 c=vec3((ay1-ay0)-(az1-az0),(bx1-bx0)-(bz1-bz0),(x1-x0)-(y1-y0));
  return c/(2.0*e);
}
`

const VEL_FRAG = /* glsl */ `
uniform float uTime,uDt,uBoil,uResolve,uSpring,uDamp,uFlowScale,uFlowSpeed,uMorph;
uniform sampler2D uTargetA,uTargetB;
${NOISE}
void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec3 pos=texture2D(texturePosition,uv).xyz;
  vec4 vs=texture2D(textureVelocity,uv);
  vec3 vel=vs.xyz;
  vec3 tgt=mix(texture2D(uTargetA,uv).xyz, texture2D(uTargetB,uv).xyz, uMorph);
  vec3 flow=curlNoise(pos*uFlowScale + vec3(0.0,0.0,uTime*uFlowSpeed));
  // per-point phase so the boil isn't globally synchronized
  flow *= 0.7 + 0.6*vs.w;
  vec3 pull=(tgt-pos)*uSpring;
  vel += (flow*uBoil + pull*uResolve)*uDt;
  vel *= uDamp;
  gl_FragColor=vec4(vel, vs.w);
}
`

const POS_FRAG = /* glsl */ `
uniform float uDt,uMorph;
uniform sampler2D uTargetA,uTargetB;
void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec4 pl=texture2D(texturePosition,uv);
  vec3 pos=pl.xyz;
  vec3 vel=texture2D(textureVelocity,uv).xyz;
  pos += vel*uDt;
  vec3 tgt=mix(texture2D(uTargetA,uv).xyz, texture2D(uTargetB,uv).xyz, uMorph);
  float d=length(tgt-pos);
  float life=1.0-clamp(d*0.5,0.0,1.0);   // 1 = crystallized onto target
  gl_FragColor=vec4(pos, life);
}
`

const RENDER_VERT = /* glsl */ `
uniform sampler2D uPositions;
uniform float uSize,uScanY,uDpr;
attribute vec2 reference;
varying float vLife; varying float vScan;
void main(){
  vec4 pl=texture2D(uPositions, reference);
  vec3 pos=pl.xyz;
  vLife=pl.w;
  vScan=1.0 - smoothstep(0.0,0.85, abs(pos.y - uScanY));
  vec4 mv=modelViewMatrix*vec4(pos,1.0);
  // uSize is in CSS px (x uDpr -> device px, consistent across monitors).
  // HARD CLAMP: unclamped near-camera sprites made the additive draw
  // catastrophically fill-bound during the #instrument dolly (camZ 7.6).
  float ps=uSize*uDpr*(1.0/max(-mv.z,0.5))*300.0*(0.55+vLife*0.75+vScan*0.6);
  gl_PointSize=clamp(ps,1.0,24.0*max(uDpr,1.0));
  gl_Position=projectionMatrix*mv;
}
`

const RENDER_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uDim; uniform float uOpacity;
varying float vLife; varying float vScan;
void main(){
  vec2 c=gl_PointCoord-0.5;
  float d=dot(c,c);
  if(d>0.25) discard;
  float soft=1.0-smoothstep(0.0,0.25,d);
  vec3 col=uColor*(0.5+vLife*0.62) + vec3(0.78,0.9,1.0)*vScan*0.8;
  // lower per-point alpha so DENSE shapes (lattice/grid/wordmark) accumulate to
  // a saturated colored glow instead of clipping to pure white.
  float alpha=soft*(0.06+vLife*0.32+vScan*0.4)*uDim*uOpacity;
  gl_FragColor=vec4(col, 1.0)*alpha;   // additive
}
`

export default function ApexField({ mobile, reduced }) {
  const gl = useThree((s) => s.gl)
  const sim = mobile ? 192 : 384 // 36k / 147k points
  const pointsRef = useRef(null)
  const dbgRef = useRef(0)
  const prevBundle = useRef(null)

  const disposeBundle = (b) => {
    if (!b) return
    b.geometry.dispose()
    b.material.dispose()
    b.atlas.forEach((t) => t.dispose())
    if (b.gpu.dispose) b.gpu.dispose()
  }

  // bake target atlas + GPGPU renderer. Keyed on [gl, sim, mobile]: `mobile`
  // (a live media query) can flip on a resize across the 800px breakpoint,
  // which changes `sim` and rebuilds everything — so dispose the PREVIOUS
  // bundle here, not only on unmount, or each flip leaks a full GPU resource set.
  const { gpu, posVar, velVar, atlas, count, geometry, material } = useMemo(() => {
    disposeBundle(prevBundle.current)
    const { textures, count } = bakeTargets(sim)
    const gpu = new GPUComputationRenderer(sim, sim, gl)
    if (gl.capabilities.isWebGL2 === false) gpu.setDataType(THREE.HalfFloatType)

    const dtPos = gpu.createTexture()
    const dtVel = gpu.createTexture()
    // Motion sessions start AS detector static (NOISE) and resolve on boot.
    // Reduced motion runs frameloop='demand' — only a handful of computes ever
    // happen, nowhere near enough to travel NOISE->PEAK — so seed the promised
    // static pose (crystallized PEAK) directly and let it just sit there.
    dtPos.image.data.set(textures[reduced ? SLOT.PEAK : SLOT.NOISE].image.data)
    const vd = dtVel.image.data
    for (let i = 0; i < vd.length; i += 4) {
      vd[i] = reduced ? 0 : (Math.random() * 2 - 1) * 0.02
      vd[i + 1] = reduced ? 0 : (Math.random() * 2 - 1) * 0.02
      vd[i + 2] = reduced ? 0 : (Math.random() * 2 - 1) * 0.02
      vd[i + 3] = Math.random() // per-point seed/phase
    }

    const posVar = gpu.addVariable('texturePosition', POS_FRAG, dtPos)
    const velVar = gpu.addVariable('textureVelocity', VEL_FRAG, dtVel)
    gpu.setVariableDependencies(posVar, [posVar, velVar])
    gpu.setVariableDependencies(velVar, [posVar, velVar])

    const seedSlot = reduced ? SLOT.PEAK : SLOT.NOISE
    Object.assign(velVar.material.uniforms, {
      uTime: { value: 0 }, uDt: { value: 1 }, uBoil: { value: reduced ? 0.05 : 0.4 },
      uResolve: { value: 1 }, uSpring: { value: 0.09 }, uDamp: { value: 0.9 },
      uFlowScale: { value: 0.22 }, uFlowSpeed: { value: 0.25 }, uMorph: { value: 0 },
      uTargetA: { value: textures[seedSlot] }, uTargetB: { value: textures[seedSlot] },
    })
    Object.assign(posVar.material.uniforms, {
      uDt: { value: 1 }, uMorph: { value: 0 },
      uTargetA: { value: textures[seedSlot] }, uTargetB: { value: textures[seedSlot] },
    })

    const err = gpu.init()
    if (err) {
      // Surface to the GLErrorBoundary -> static readout fallback. A silent
      // warn here left a mounted-but-empty canvas: the page looked dead.
      textures.forEach((t) => t.dispose())
      if (gpu.dispose) gpu.dispose()
      throw new Error('[apex] GPGPU init failed: ' + err)
    }

    // reduced motion: settle the seeded pose fully before the first visible
    // frame (frameloop='demand' will never grant enough steps afterwards).
    if (reduced) for (let i = 0; i < 40; i++) gpu.compute()

    // render geometry: one vertex per sim texel, carrying its reference uv
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const reference = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      reference[i * 2] = (i % sim) / sim
      reference[i * 2 + 1] = Math.floor(i / sim) / sim
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: null },
        // CSS-px base (x uDpr in the shader). 0.72 @ dpr2 matches the validated
        // retina look; 1x monitors now get the same visual thickness.
        uSize: { value: mobile ? 0.55 : 0.72 },
        uDpr: { value: gl.getPixelRatio() },
        uScanY: { value: -999 },
        uColor: { value: new THREE.Color('#2E9BE6') },
        uDim: { value: 1 },
        uOpacity: { value: 1 },
      },
      vertexShader: RENDER_VERT,
      fragmentShader: RENDER_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    const bundle = { gpu, posVar, velVar, atlas: textures, count, geometry, material }
    prevBundle.current = bundle
    return bundle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, sim, mobile, reduced])

  useEffect(() => {
    return () => disposeBundle(prevBundle.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clock = useRef(0)
  useFrame((_, delta) => {
    if (document.hidden && !window.__QA__) return
    const s = apexStore
    const dt = reduced ? 0.9 : Math.min(delta, 0.033) * 60 // ~1 per 60fps, capped
    clock.current += reduced ? 0 : delta

    // resolve field state from the continuous seq index
    const seq = Math.max(0, Math.min(SLOT_COUNT - 1 - 1e-4, s.seq))
    const a = Math.floor(seq)
    const b = Math.min(SLOT_COUNT - 1, a + 1)
    const frac = seq - a

    const vu = velVar.material.uniforms
    const pu = posVar.material.uniforms
    vu.uTargetA.value = atlas[a]; vu.uTargetB.value = atlas[b]; vu.uMorph.value = frac
    pu.uTargetA.value = atlas[a]; pu.uTargetB.value = atlas[b]; pu.uMorph.value = frac

    // boil = idle floor + scroll-velocity injection; resolve stiffens the
    // spring. Fast scroll (velBoil high) also LOOSENS the crystal, so the field
    // seethes as detector static while moving and locks when you stop.
    const vb = reduced ? 0 : s.velBoil
    const resolve = reduced ? 1 : s.resolve * (1 - Math.min(vb * 0.2, 0.62))
    const boil = reduced ? 0.06 : s.boilBase + vb
    vu.uTime.value = clock.current
    vu.uDt.value = dt
    vu.uBoil.value = boil
    vu.uResolve.value = resolve
    // spring gets stiffer as we crystallize; damping tighter too so it locks
    vu.uSpring.value = 0.05 + resolve * 0.14
    vu.uDamp.value = 0.82 + resolve * 0.1
    pu.uDt.value = dt

    gpu.compute()
    const posRT = gpu.getCurrentRenderTarget(posVar)
    material.uniforms.uPositions.value = posRT.texture

    // One-shot first-frame verification: read back a few sim texels and tell
    // the stage whether the GPGPU output is real. NaN output -> 'apex-sim-fail'
    // (stage keeps the SVG readout); finite -> 'apex-sim-ok' (fallback fades).
    // A throw (float readback restricted) proves nothing — treat as ok.
    if (dbgRef.current < 1) {
      dbgRef.current = 1
      let ok = true
      try {
        const buf = new Float32Array(16)
        gl.readRenderTargetPixels(posRT, sim >> 1, sim >> 1, 2, 2, buf)
        const finite = Array.from(buf).every((v) => Number.isFinite(v))
        const allZero = Array.from(buf).every((v) => v === 0)
        ok = finite && !allZero
        window.__apexDbg = {
          sample: Array.from(buf.slice(0, 8)), hasTex: !!posRT.texture, count, sim,
          matSize: material.uniforms.uSize.value,
          color: material.uniforms.uColor.value.getHexString(),
        }
      } catch (e) { window.__apexDbg = { err: String(e) } }
      window.dispatchEvent(new CustomEvent(ok ? 'apex-sim-ok' : 'apex-sim-fail'))
    }

    // signal color eases toward the selected compound
    if (!reduced) s.accent.lerp(s.target, 0.08)
    material.uniforms.uColor.value.copy(s.accent)
    material.uniforms.uScanY.value = s.scan
    material.uniforms.uDim.value = s.dim
    material.uniforms.uDpr.value = gl.getPixelRatio() // tracks monitor moves
    material.uniforms.uOpacity.value = 1 - s.lens * 0.1 // keep the peak bright to refract
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
