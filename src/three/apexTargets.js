import * as THREE from 'three'

// Bakes the target atlas: for a SIM×SIM point count, each "slot" is a float
// texture of xyz target positions the GPGPU field springs toward. Scrubbing
// the field's `seq` from slot to slot walks the cloud through every shape —
// this is what makes the long scroll a tour of distinct instrument readouts.
//
// Slot order IS the scroll order of the field's set-pieces:
export const SLOT = {
  NOISE: 0, // detector static — diffuse sphere of noise
  WORDMARK: 1, // "APEXION" resolves out of the static
  PEAK: 2, // one tall chromatogram gaussian on a flat baseline
  CLUSTER3: 3, // three molecular scatter clusters (the catalog)
  LATTICE: 4, // GHK-Cu copper coordination lattice (cubic grid)
  RING: 5, // 5-Amino-1MQ compact aromatic ring cluster (torus)
  CHAIN: 6, // Retatrutide long folded peptide chain
  MZBARS: 7, // mass-spec fingerprint — discrete m/z bars
  SPHERE: 8, // cryo scan reconstruction — spherical shell
  GRID: 9, // COA data-grid — flat sheet of points
  FORMULA: 10, // molecular formula assembles from points
  BASELINE: 11, // final decay — a single flat baseline trace
}
export const SLOT_COUNT = 12

// small deterministic PRNG so bakes are stable frame-to-frame / reload-to-reload
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// sample text into a list of [x,y] filled pixels mapped to world coords.
function textPoints(text, worldW, worldH, weight = 800, wdth = 125) {
  const W = 512
  const H = Math.round(W * (worldH / worldW))
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // font-variation isn't honored on 2d canvas everywhere; pick a heavy family.
  ctx.font = `${weight} ${Math.round(H * 0.62)}px "Archivo Variable", "Arial Black", sans-serif`
  ctx.setTransform(wdth / 100, 0, 0, 1, W / 2 - (W / 2) * (wdth / 100), 0)
  ctx.fillText(text, W / 2 / (wdth / 100), H / 2)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const data = ctx.getImageData(0, 0, W, H).data
  const pts = []
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (data[(y * W + x) * 4] > 128) {
        pts.push([(x / W - 0.5) * worldW, -(y / H - 0.5) * worldH])
      }
    }
  }
  return pts.length ? pts : [[0, 0]]
}

// Bakes are deterministic per sim size, so cache the Float32Arrays: crossing
// the 800px breakpoint (iPad rotation) rebuilds the GPGPU bundle, and without
// this the ~28MB of target math re-runs synchronously inside render. Textures
// are rebuilt fresh each call (they get disposed with their bundle); the
// arrays are safely shared.
const bakeCache = new Map()

export function bakeTargets(sim) {
  const count = sim * sim
  if (bakeCache.has(sim)) {
    const cached = bakeCache.get(sim)
    const textures = cached.map((arr) => {
      const t = new THREE.DataTexture(arr, sim, sim, THREE.RGBAFormat, THREE.FloatType)
      t.needsUpdate = true
      return t
    })
    return { textures, count, sim }
  }
  const rnd = mulberry32(0x9e3779b9)
  const rn = () => rnd() * 2 - 1

  const arrays = []
  for (let s = 0; s < SLOT_COUNT; s++) arrays.push(new Float32Array(count * 4))

  // pre-sample the two text targets. The formula is GHK-Cu's — it must match a
  // formula the #formula section actually lists, or the readout contradicts it.
  const wordPts = textPoints('APEXION', 12.5, 3.0)
  const formulaPts = textPoints('C₁₄H₂₄N₆O₄·Cu', 12.5, 2.4, 700)

  for (let i = 0; i < count; i++) {
    const o = i * 4
    const u = rnd()
    const v = rnd()

    // 0 — NOISE: diffuse fuzzy sphere of detector static
    {
      const r = 3.2 + rnd() * 3.4
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(rn())
      arrays[0][o] = r * Math.sin(ph) * Math.cos(th)
      arrays[0][o + 1] = r * Math.sin(ph) * Math.sin(th)
      arrays[0][o + 2] = r * Math.cos(ph) * 0.6
    }

    // 1 — WORDMARK: sample APEXION text plane, tiny z thickness
    {
      const p = wordPts[(rnd() * wordPts.length) | 0]
      arrays[1][o] = p[0] + rn() * 0.03
      arrays[1][o + 1] = p[1] + rn() * 0.03
      arrays[1][o + 2] = rn() * 0.15
    }

    // 2 — PEAK: chromatogram trace — flat baseline + one tall gaussian + 2 minor
    {
      const x = (u - 0.5) * 11.5
      const base = -3.4
      const main = 6.6 * Math.exp(-Math.pow((x - 0.6) / 0.62, 2))
      const minor1 = 1.5 * Math.exp(-Math.pow((x + 3.1) / 0.5, 2))
      const minor2 = 1.0 * Math.exp(-Math.pow((x - 3.6) / 0.55, 2))
      // points hug the trace, thinning above it
      const trace = base + main + minor1 + minor2
      const fill = base + (trace - base) * v // fill under the curve
      arrays[2][o] = x
      arrays[2][o + 1] = fill + rn() * 0.05
      arrays[2][o + 2] = rn() * 0.4
    }

    // 3 — CLUSTER3: three gaussian molecular clusters (catalog)
    {
      const which = i % 3
      const cx = which === 0 ? -3.9 : which === 1 ? 0 : 3.9
      const g = () => (rn() + rn() + rn()) / 3
      arrays[3][o] = cx + g() * 1.7
      arrays[3][o + 1] = g() * 1.9
      arrays[3][o + 2] = g() * 1.7
    }

    // 4 — LATTICE: copper coordination cubic lattice with jitter
    {
      const n = 13
      const gx = i % n
      const gy = ((i / n) | 0) % n
      const gz = ((i / (n * n)) | 0) % n
      arrays[4][o] = (gx / (n - 1) - 0.5) * 8.6 + rn() * 0.14
      arrays[4][o + 1] = (gy / (n - 1) - 0.5) * 8.0 + rn() * 0.14
      arrays[4][o + 2] = (gz / (n - 1) - 0.5) * 8.6 + rn() * 0.14
    }

    // 5 — RING: compact aromatic ring cluster (fat torus)
    {
      const a = rnd() * Math.PI * 2
      const R = 3.1
      const r = 0.34 + rnd() * 0.28
      const b = rnd() * Math.PI * 2
      arrays[5][o] = (R + r * Math.cos(b)) * Math.cos(a)
      arrays[5][o + 1] = (R + r * Math.cos(b)) * Math.sin(a)
      arrays[5][o + 2] = r * Math.sin(b) * 1.4
    }

    // 6 — CHAIN: long folded peptide backbone (parametric wander) + scatter
    {
      const t = u
      const x = (t - 0.5) * 11.0
      const y = Math.sin(t * 22.0) * 1.9 + Math.sin(t * 7.0 + 1.0) * 1.1
      const z = Math.cos(t * 15.0) * 1.4 + Math.sin(t * 4.0) * 0.9
      arrays[6][o] = x + rn() * 0.12
      arrays[6][o + 1] = y + rn() * 0.12
      arrays[6][o + 2] = z + rn() * 0.12
    }

    // 7 — MZBARS: mass-spec fingerprint — points fill discrete vertical bars
    {
      const bars = 11
      const bi = (u * bars) | 0
      const heights = [1.4, 2.2, 6.4, 1.1, 3.8, 5.2, 1.6, 4.6, 2.0, 3.0, 1.2]
      const h = heights[bi % bars]
      const x = (bi / (bars - 1) - 0.5) * 11.0
      arrays[7][o] = x + rn() * 0.12
      arrays[7][o + 1] = -3.4 + v * h
      arrays[7][o + 2] = rn() * 0.25
    }

    // 8 — SPHERE: cryo scan — thin spherical shell
    {
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(rn())
      const R = 4.3 + rn() * 0.1
      arrays[8][o] = R * Math.sin(ph) * Math.cos(th)
      arrays[8][o + 1] = R * Math.sin(ph) * Math.sin(th)
      arrays[8][o + 2] = R * Math.cos(ph)
    }

    // 9 — GRID: flat COA data sheet — regular lattice in the xy plane
    {
      const n = Math.round(Math.sqrt(count))
      const gx = i % n
      const gy = (i / n) | 0
      arrays[9][o] = (gx / (n - 1) - 0.5) * 12.0
      arrays[9][o + 1] = (gy / (n - 1) - 0.5) * 7.4
      arrays[9][o + 2] = rn() * 0.05
    }

    // 10 — FORMULA: sample molecular-formula text
    {
      const p = formulaPts[(rnd() * formulaPts.length) | 0]
      arrays[10][o] = p[0] + rn() * 0.03
      arrays[10][o + 1] = p[1] + rn() * 0.03
      arrays[10][o + 2] = rn() * 0.12
    }

    // 11 — BASELINE: single flat trace, the decay to zero
    {
      arrays[11][o] = (u - 0.5) * 12.0
      arrays[11][o + 1] = -2.6 + rn() * 0.04
      arrays[11][o + 2] = rn() * 0.03
    }

    // w channel unused in targets (kept 1)
    for (let s = 0; s < SLOT_COUNT; s++) arrays[s][o + 3] = 1
  }

  bakeCache.set(sim, arrays)
  const textures = arrays.map((arr) => {
    const t = new THREE.DataTexture(arr, sim, sim, THREE.RGBAFormat, THREE.FloatType)
    t.needsUpdate = true
    return t
  })
  return { textures, count, sim }
}
