import { useLayoutEffect, useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  /** stagger delay in ms */
  delay?: number
}

/**
 * Fades a section in as it scrolls into view.
 *
 * This used to run on GSAP, which cost 232 kB in the entry bundle for one fade
 * and one translate. The same effect is two CSS transitions, so the animation
 * now runs on the compositor and the library is gone.
 */
export default function Reveal({ children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const show = () => {
      el.style.opacity = '1'
      el.style.transform = 'none'
      el.style.visibility = 'visible'
    }

    // Keep the CSS baseline visible. This is deliberate progressive enhancement:
    // a failed script, unsupported observer, or a cancelled animation should
    // never leave a section permanently invisible.
    if (reduceMotion.matches || typeof IntersectionObserver === 'undefined') {
      show()
      return
    }

    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.visibility = 'hidden'
    el.style.transition =
      `opacity 650ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms,` +
      `transform 650ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`

    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      show()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
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
    }
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
