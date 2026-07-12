import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib/env'

const GLYPHS = '!<>-_/[]{}=+*^?#0123456789ABCDEF'

/**
 * Text decodes out of detector noise: glyphs churn, then resolve left→right.
 * Renders the real text from the first paint (never hidden by JS), scrambles
 * only once visible, and carries a wall-clock failsafe that force-restores the
 * true text — churn can never strand gibberish on screen.
 */
export default function Scramble({ text, as: Tag = 'span', className = '', delay = 0, speed = 26, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    let interval = null
    let started = false
    const timers = []
    let io = null

    const run = () => {
      if (started) return
      started = true
      let frame = 0
      const total = Math.max(14, Math.min(text.length + 10, 34))
      interval = setInterval(() => {
        frame++
        const reveal = Math.floor((frame / total) * text.length)
        let out = ''
        for (let i = 0; i < text.length; i++) {
          out += i < reveal || text[i] === ' ' ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        el.textContent = out
        if (frame >= total) {
          el.textContent = text
          clearInterval(interval)
        }
      }, speed)
    }

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) => {
          if (es.some((e) => e.isIntersecting)) {
            io.disconnect()
            timers.push(setTimeout(run, delay))
          }
        },
        { threshold: 0.2 }
      )
      io.observe(el)
    } else {
      timers.push(setTimeout(run, delay))
    }
    // failsafe: whatever happened, the true text stands
    timers.push(setTimeout(() => { if (interval) clearInterval(interval); el.textContent = text }, 5000))

    return () => {
      if (interval) clearInterval(interval)
      timers.forEach(clearTimeout)
      if (io) io.disconnect()
      el.textContent = text
    }
  }, [text, delay, speed])
  return (
    <Tag ref={ref} className={className} {...rest}>
      {text}
    </Tag>
  )
}
