import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'

interface Props {
  children: ReactNode
  className?: string
  /** stagger delay in ms */
  delay?: number
}

export default function Reveal({ children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Keep the CSS baseline visible. This is deliberate progressive enhancement:
    // a failed script, unsupported observer, or a cancelled animation should
    // never leave a section permanently invisible.
    if (reduceMotion.matches || typeof IntersectionObserver === 'undefined') {
      gsap.set(el, { autoAlpha: 1, y: 0 })
      return
    }

    gsap.set(el, { autoAlpha: 0, y: 20 })
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        delay: delay / 1000,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          observer.unobserve(el)
        }
      },
      // Start just before the card reaches the viewport. A positive bottom
      // margin prevents the first row of a section looking cut off on load.
      { threshold: 0, rootMargin: '0px 0px 8% 0px' },
    )
    observer.observe(el)

    // Browsers can suspend IntersectionObserver callbacks during navigation
    // or while a tab is restored from bfcache. Failing open is preferable to
    // retaining a hidden card in that edge case.
    const fallbackTimer = window.setTimeout(reveal, 1400 + delay)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallbackTimer)
      gsap.killTweensOf(el)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  )
}
