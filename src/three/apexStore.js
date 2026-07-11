import * as THREE from 'three'

// APEXION store. ONE global scrub writes `seq` (0..N = which two baked target
// shapes the point-field is morphing between) plus camera + physics uniforms.
// The GPGPU field reads this every frame: it springs a million-ish points
// toward the current target while curl-noise + scroll velocity BOIL them; when
// you stop, `resolve` eases to 1 and the cloud crystallizes into the shape.
//
// "You are not looking at the compound. You are looking through the detector
//  at it." — purity = the field going still.
export const apexStore = {
  progress: 0, // 0..1 down the whole document
  intro: 0, // 0..1 boot resolve on load

  // field state machine: continuous index into the baked target atlas.
  // floor(seq)=slotA, ceil(seq)=slotB, frac=morph. Scrubbing seq across the
  // page walks the field through every shape (noise → wordmark → peak → …).
  seq: 0,

  // physics
  resolve: 1, // 0 = pure boil/static, 1 = crystallized onto the target
  boilBase: 0.35, // idle turbulence floor
  velBoil: 0, // extra boil injected from |scroll velocity| (set each frame by the choreography ticker)
  scan: -1, // scan-plane world-Y; <-100 = off. Brightens points it passes.
  lens: 0, // 0..1 refraction-lens set-piece presence

  // camera rig (world units). Field is centered near origin, ~R=6 wide.
  camZ: 15,
  camX: 0,
  camY: 0,
  camRoll: 0,
  fov: 40,
  dim: 1, // 1 full presence -> ~0.4 recessed behind content cabins

  // signal color — exactly one compound accent is live at a time.
  accent: new THREE.Color('#2E9BE6'),
  target: new THREE.Color('#2E9BE6'),

  _seqCount: 12,
}

// selection re-tints the signal + absorption color (lerped, or snapped under
// reduced motion). Kept name-compatible with the shared Catalog/Order wiring.
export function setVialColor(hex, _deep, snap = false) {
  apexStore.target.set(hex)
  if (snap) {
    apexStore.accent.set(hex)
    window.dispatchEvent(new CustomEvent('apex-color-snap'))
  }
}
