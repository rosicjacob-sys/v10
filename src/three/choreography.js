import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { apexStore, setVialColor } from './apexStore'
import { scrollState } from '../lib/scroll'
import { MQ_DESKTOP, MQ_MOBILE, MQ_REDUCED_DESKTOP, MQ_REDUCED_MOBILE } from '../lib/env'

gsap.registerPlugin(ScrollTrigger)

const CYAN = '#2E9BE6'
const AMBER = '#F5822B'
const WHITE = '#EAF2F8'

/**
 * APEXION choreography. ONE global scrub walks `seq` (0..11) through the baked
 * target atlas as you descend — the point-field re-sorts from detector static
 * into the wordmark, one chromatogram peak, the catalog clusters, each
 * compound's structure, its mass fingerprint, a scan sphere, a data grid, the
 * molecular formula, and finally decays to a flat baseline. A gsap.ticker
 * injects |scroll velocity| as extra boil so the field seethes while you move
 * and crystallizes when you stop.
 */
export function useApexChoreography() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    // scrubbed numeric waypoint (no color — accent is set stepwise via callbacks)
    const wp = (trigger, vars, start = 'top bottom', end = 'top 35%') =>
      gsap.to(apexStore, {
        ...vars, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger, start, end, scrub: 0.6, invalidateOnRefresh: true },
      })

    // accent switch when a compound (or neutral) zone owns the screen
    const accentAt = (trigger, hex, start = 'top 60%', end = 'bottom 40%') =>
      ScrollTrigger.create({
        trigger, start, end,
        onEnter: () => setVialColor(hex, hex),
        onEnterBack: () => setVialColor(hex, hex),
      })

    // a scan-plane sweep (world-Y top->bottom) tied to a section. Resting
    // endpoints are OUTSIDE every shape's 0.85 falloff (|y|max ≈ 6.6), so the
    // lagging scrub can never strand a visible plane — no callbacks to race.
    const scanSweep = (trigger) => {
      gsap.fromTo(apexStore, { scan: 8.5 }, {
        scan: -8.5, ease: 'none', immediateRender: false,
        scrollTrigger: {
          trigger, start: 'top 75%', end: 'bottom 45%', scrub: 0.4, invalidateOnRefresh: true,
        },
      })
    }

    // intro -> scrub handoff. Kill the boot morph (seq belongs to the scrub the
    // moment scrolling starts) but NEVER strand its other fields mid-ease:
    // boilBase/resolve/intro glide to their final values on their own tween.
    // No isActive() gate — a delayed tween must die too (deep-link loads).
    const handOff = (tween) => {
      if (tween.__done) return
      tween.__done = true
      tween.kill()
      gsap.to(apexStore, { intro: 1, resolve: 1, boilBase: 0.09, duration: 0.7, ease: 'power2.out', overwrite: 'auto' })
    }

    mm.add(MQ_DESKTOP, () => {
      gsap.set(apexStore, {
        progress: 0, intro: 0, seq: 0, resolve: 0.25, boilBase: 0.5,
        scan: -999, lens: 0, dim: 1, camZ: 15, camX: 0, camY: 0, camRoll: 0, fov: 40,
      })
      setVialColor(CYAN, CYAN, true)
      // boot resolve: static condenses into the wordmark, then one peak
      const introTween = gsap.to(apexStore, { intro: 1, seq: 2, resolve: 1, boilBase: 0.09, duration: 2.6, ease: 'power2.inOut', delay: 0.3, overwrite: 'auto' })
      // whole-document spine. The moment the user scrolls, hand `seq` to the
      // scrub via handOff (which glides the intro's other fields home).
      gsap.to(apexStore, {
        progress: 1, ease: 'none',
        scrollTrigger: {
          trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => { if (self.progress > 0.001) handOff(introTween) },
        },
      })
      // deep links / scroll restoration: the spine's onUpdate needs movement,
      // so if the page initializes already scrolled, hand off right now.
      if ((scrollState.lenis?.scroll ?? window.scrollY) > 4) handOff(introTween)

      // --- the tour: the field is the TRAVELING HERO. It re-sorts into a new
      // shape AND swings side-to-side (camX zig-zags) as the tracked signal
      // moves down the page — bright (frosted cabins protect legibility).
      wp('#thesis', { seq: 2, resolve: 1, dim: 0.92, camZ: 13, camX: -2.6, camY: 0.3 })
      wp('#instrument', { seq: 2.3, resolve: 1, dim: 1, camZ: 7.6, camX: 1.6, camY: 0.3 }) // dolly INTO the field
      wp('#lens', { seq: 2, lens: 0, resolve: 1, dim: 1, camZ: 10.5, camX: 0.2, camY: 0 })
      wp('#verify', { seq: 2, lens: 0, resolve: 1, dim: 0.78, camZ: 12.5, camX: 2.6, camY: -0.2 })
      scanSweep('#verify')
      wp('#catalog', { seq: 3, resolve: 1, dim: 0.62, camZ: 15, camX: -2.8, camY: 0 })
      wp('#ghk', { seq: 4, resolve: 1, dim: 0.95, camZ: 11.5, camX: -2.8, camY: 0.25 })   // cabin left → field RIGHT
      wp('#amino', { seq: 5, resolve: 1, dim: 0.95, camZ: 11, camX: 2.8, camY: -0.25 })   // cabin right → field LEFT
      wp('#reta', { seq: 6, resolve: 1, dim: 0.95, camZ: 11.5, camX: -2.8, camY: 0.25 })  // cabin left → field RIGHT
      wp('#massspec', { seq: 7, resolve: 1, dim: 0.9, camZ: 13, camX: 2.6, camY: -0.3 })
      wp('#scan', { seq: 8, resolve: 1, dim: 0.95, camZ: 11.5, camX: -2.4, camY: 0.1 })
      scanSweep('#scan')
      wp('#reviews', { seq: 9, resolve: 1, dim: 0.6, camZ: 15, camX: 2.8, camY: 0 })
      wp('#cold', { seq: 9, resolve: 1, dim: 0.8, camZ: 13, camX: -2.6, camY: 0.2 })
      wp('#formula', { seq: 10, resolve: 1, dim: 0.95, camZ: 12, camX: 2.4, camY: 0.2 })
      wp('#order', { seq: 9, resolve: 1, dim: 0.55, camZ: 15, camX: -2.8, camY: 0 })
      wp('#faq', { seq: 9, resolve: 1, dim: 0.6, camZ: 15, camX: 2.8, camY: 0 })
      wp('#final-cta', { seq: 11, resolve: 1, dim: 1, camZ: 12.5, camX: 0, camY: 0 }, 'top bottom', 'top 45%')

      // accents: neutral cyan everywhere except the three compound focus zones
      accentAt('#ghk', CYAN)
      accentAt('#amino', AMBER)
      accentAt('#reta', WHITE)
      accentAt('#massspec', CYAN)
      accentAt('#cold', WHITE)
      accentAt('#formula', CYAN)
    })

    mm.add(MQ_MOBILE, () => {
      gsap.set(apexStore, {
        progress: 0, intro: 0, seq: 0, resolve: 0.3, boilBase: 0.45,
        scan: -999, lens: 0, dim: 0.7, camZ: 20, camX: 0, camY: 0, camRoll: 0, fov: 46,
      })
      setVialColor(CYAN, CYAN, true)
      const introTweenM = gsap.to(apexStore, { intro: 1, seq: 2, resolve: 1, boilBase: 0.09, duration: 2.4, ease: 'power2.inOut', delay: 0.3, overwrite: 'auto' })
      gsap.to(apexStore, {
        progress: 1, ease: 'none',
        scrollTrigger: {
          trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => { if (self.progress > 0.001) handOff(introTweenM) },
        },
      })
      if ((scrollState.lenis?.scroll ?? window.scrollY) > 4) handOff(introTweenM)
      // field travels top→bottom on mobile too (smaller camX amplitude), brighter
      wp('#thesis', { seq: 2, resolve: 1, dim: 0.7, camZ: 18, camY: 2.6, camX: 0 })
      wp('#instrument', { seq: 2.4, resolve: 1, dim: 0.85, camZ: 12.5, camY: 0, camX: 0 })
      wp('#lens', { seq: 2, resolve: 1, dim: 0.8, camZ: 16, camY: 0, camX: 0 })
      wp('#verify', { seq: 2, resolve: 1, dim: 0.6, camZ: 17, camY: -2.4, camX: 0 })
      scanSweep('#verify')
      wp('#catalog', { seq: 3, resolve: 1, dim: 0.5, camZ: 19, camY: 2.4, camX: 0 })
      wp('#ghk', { seq: 4, resolve: 1, dim: 0.8, camZ: 16, camY: -2.2, camX: 1.4 })
      wp('#amino', { seq: 5, resolve: 1, dim: 0.8, camZ: 15.5, camY: -2.2, camX: -1.4 })
      wp('#reta', { seq: 6, resolve: 1, dim: 0.8, camZ: 16, camY: -2.2, camX: 1.4 })
      wp('#massspec', { seq: 7, resolve: 1, dim: 0.7, camZ: 17, camY: 2.4, camX: 0 })
      wp('#scan', { seq: 8, resolve: 1, dim: 0.8, camZ: 15.5, camY: 0, camX: 0 })
      scanSweep('#scan')
      wp('#reviews', { seq: 9, resolve: 1, dim: 0.48, camZ: 19, camY: 2.4, camX: 0 })
      wp('#cold', { seq: 9, resolve: 1, dim: 0.65, camZ: 17, camY: -2.2, camX: 0 })
      wp('#formula', { seq: 10, resolve: 1, dim: 0.8, camZ: 15.5, camY: 2.2, camX: 0 })
      wp('#order', { seq: 9, resolve: 1, dim: 0.48, camZ: 19, camY: 2.4, camX: 0 })
      wp('#faq', { seq: 9, resolve: 1, dim: 0.5, camZ: 19, camY: 2.2, camX: 0 })
      wp('#final-cta', { seq: 11, resolve: 1, dim: 0.9, camZ: 16, camY: 0, camX: 0 }, 'top bottom', 'top 45%')
      accentAt('#ghk', CYAN)
      accentAt('#amino', AMBER)
      accentAt('#reta', WHITE)
      accentAt('#cold', WHITE)
    })

    // reduced motion: freeze on one crystallized peak, no boil/scan/lens
    const staticPose = (mobile) => () => {
      setVialColor(CYAN, CYAN, true)
      gsap.set(apexStore, {
        progress: 0.15, intro: 1, seq: 2, resolve: 1, boilBase: 0.04, velBoil: 0,
        scan: -999, lens: 0, dim: mobile ? 0.7 : 0.85,
        camZ: mobile ? 18 : 13, camX: 0, camY: 0, camRoll: 0, fov: mobile ? 46 : 40,
      })
    }
    mm.add(MQ_REDUCED_DESKTOP, staticPose(false))
    mm.add(MQ_REDUCED_MOBILE, staticPose(true))

    // scroll-velocity -> boil coupling (runs across all motion contexts)
    let vb = 0
    const velTick = () => {
      const speed = Math.min(Math.abs(scrollState.velocity) * 0.9, 3.2)
      vb += (speed - vb) * 0.15
      apexStore.velBoil = vb
    }
    gsap.ticker.add(velTick)

    return () => { mm.revert(); gsap.ticker.remove(velTick) }
  }, [])
}
