import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import { useTranslation } from 'react-i18next'

import { GlobeErrorBoundary } from '../GlobeErrorBoundary'
import { GLOBE_THEME } from '../../lib/globe-theme'
import { numericFor } from '../../lib/isoNumeric'
import { useThemeMode } from '../../lib/theme'
import type { Country } from '../../lib/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

// three.js and react-globe.gl are 1.8 MB between them. They are fetched after
// this component has already rendered its panel, so nothing about the page's
// first paint waits on them, and a visitor who never scrolls to the picker on a
// metered connection pays nothing — see the `visible` gate below.
const GlobeCore = lazy(() => import('../account/GlobeCore'))

const GEO_URL = '/world-110m.json'

/**
 * The catalogue as a planet.
 *
 * The same sphere the account page draws, given the shop's countries instead of
 * the customer's own. Every country we sell is raised and lit; the rest of the
 * world is the flat backdrop it should be, which is the one thing a projected
 * map cannot say — on a rectangle Greenland argues with Africa, and the eye
 * reads size as importance.
 *
 * Three things keep it from costing what a WebGL scene usually costs:
 *
 *   - it renders only once the panel is actually on screen, so a visitor who
 *     lands on the alphabetical index below never loads three.js at all;
 *   - the flat SVG map stays mounted underneath until the sphere is ready, so
 *     there is no empty box and no layout shift;
 *   - a machine with no WebGL context keeps the SVG permanently, because the
 *     boundary reports the failure upward rather than drawing an error.
 */
export default function GlobePanel({
  countries,
  onPick,
  onUnavailable,
}: {
  countries: Country[]
  onPick: (country: Country) => void
  /** Told when the globe cannot be drawn, so the caller keeps the flat map. */
  onUnavailable: () => void
}) {
  const { t } = useTranslation()
  const mode = useThemeMode()
  const palette = mode === 'dark' ? GLOBE_THEME.dark : GLOBE_THEME.light
  const hostRef = useRef<HTMLDivElement>(null)
  const [features, setFeatures] = useState<any[]>([])
  const [visible, setVisible] = useState(false)
  const [size, setSize] = useState({ w: 640, h: 420 })

  // Not `useEffect` on mount: the picker sits below the fold on a phone, and a
  // 1.8 MB download for a panel nobody scrolled to is the cost this page was
  // built to avoid.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setVisible(true),
      { rootMargin: '200px' },
    )
    io.observe(host)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let live = true
    fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error('geo')
        return r.json()
      })
      .then((topo) => live && setFeatures((feature(topo, topo.objects.countries) as any).features))
      .catch(() => live && onUnavailable())
    return () => {
      live = false
    }
  }, [visible, onUnavailable])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }),
    )
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  // The shop's countries, keyed the way the topojson features are: by the ISO
  // 3166-1 numeric code, because that is the only id the geometry carries.
  const catalogByNumeric = useMemo(() => {
    const m = new Map<number, Country>()
    for (const c of countries) {
      const n = numericFor(c.iso2)
      if (n != null) m.set(n, c)
    }
    return m
  }, [countries])

  // Nothing is "visited" here: this is the catalogue, not somebody's passport.
  const visited = useMemo(() => new Map<number, string>(), [])

  return (
    <div
      ref={hostRef}
      className="wp-globe"
      style={{ background: palette.space, boxShadow: palette.inset }}
      aria-label={t('destinations.mapLabel')}
    >
      {visible && features.length > 0 && (
        <GlobeErrorBoundary fallback={<GlobeGone onMount={onUnavailable} />}>
          <Suspense fallback={null}>
            <GlobeCore
              features={features}
              catalogByNumeric={catalogByNumeric}
              visited={visited}
              palette={palette}
              width={size.w}
              height={size.h}
              /* Nearer than the account panel's default: this box is a
                 letterbox and the planet is lost in it at 2.5. */
              altitude={2.1}
              /* Where the shop's catalogue actually is. The account globe opens
                 on the Atlantic, which for this page is an ocean and nine of
                 the ten best-selling destinations off the right-hand edge. */
              focus={{ lat: 26, lng: 62 }}
              onCountryClick={onPick}
            />
          </Suspense>
        </GlobeErrorBoundary>
      )}
    </div>
  )
}

/** Renders nothing; its only job is to tell the caller on the way in. */
function GlobeGone({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount])
  return null
}
