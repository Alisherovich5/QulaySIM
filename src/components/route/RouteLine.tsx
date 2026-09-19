import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * The dotted flight path over the chosen countries.
 *
 * Decoration, and treated as decoration everywhere it could stop being one: it
 * is `aria-hidden`, it is not focusable, and CSS gives it `pointer-events:
 * none` so it can lie over the chips without swallowing a tap meant for the ×
 * on one of them.
 *
 * The dots are placed by measuring the chips rather than by dividing the width
 * into equal parts. Evenly spaced points looked right with three chips on a
 * 1440px screen and wrong everywhere else — with the row centred, the first and
 * last dot sat out in the gutter, connecting nothing to nothing.
 *
 * Drawn in real pixels from a measured box rather than in a fixed viewBox: with
 * `preserveAspectRatio` left alone the curve flattens away from the chips, and
 * set to `none` it stretches the dots into ovals and turns one dash pattern
 * into two.
 */
export default function RouteLine({
  chipsRef,
  count,
}: {
  chipsRef: RefObject<HTMLElement | null>
  count: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [xs, setXs] = useState<number[]>([])

  useEffect(() => {
    const node = ref.current
    const chips = chipsRef.current
    if (!node || !chips) return

    const measure = () => {
      setBox({ w: node.clientWidth, h: node.clientHeight })
      const origin = node.getBoundingClientRect().left
      const centres = [...chips.querySelectorAll('.rp-chip')].map((chip) => {
        const rect = chip.getBoundingClientRect()
        return rect.left - origin + rect.width / 2
      })
      setXs(centres)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    observer.observe(chips)
    return () => observer.disconnect()
    // `count` is in the list because a chip added or removed changes the
    // positions without changing either box's size — two chips swapping places
    // in a grid row is not a resize.
  }, [chipsRef, count])

  // One stop is a destination, not a route. Nothing to connect.
  const draw = xs.length >= 2 && box.w > 0 && box.h > 0
  const baseline = box.h - 6

  // Each leg is its own arc, so the line reads as hops between places rather
  // than as one long curve that happens to pass near them.
  const legs = draw
    ? xs
        .slice(0, -1)
        .map((x, index) => ({ x, next: xs[index + 1] }))
        // Two chips stacked in the same column of the mobile grid share an x.
        // An arc between them has nowhere to go and draws a spike instead.
        .filter(({ x, next }) => Math.abs(next - x) > 8)
        .map(({ x, next }) => {
          const lift = Math.min(baseline - 4, Math.abs(next - x) * 0.4)
          return `M ${x} ${baseline} Q ${(x + next) / 2} ${baseline - lift} ${next} ${baseline}`
        })
    : []

  return (
    <div ref={ref} className="rp-route" aria-hidden="true">
      {draw && (
        <svg width={box.w} height={box.h} focusable="false" aria-hidden="true">
          {/* Index keys on purpose: these are positions on a decoration, not
              identities, and two chips in a two-column grid genuinely do share
              an x — which made a coordinate key collide on every phone width. */}
          {legs.map((d, index) => (
            <path key={index} d={d} />
          ))}
          {[...new Set(xs)].map((x, index) => (
            <circle key={index} cx={x} cy={baseline} r={3.5} />
          ))}
        </svg>
      )}
    </div>
  )
}
