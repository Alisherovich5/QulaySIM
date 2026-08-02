import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { feature } from 'topojson-client'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Globe2, Maximize2, RotateCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Country, PassportCountry } from '../../lib/types'
import { numericFor } from '../../lib/isoNumeric'
import { api } from '../../lib/api'

// Heavy (three.js) — only loaded when this account tab renders / globe opens.
const GlobeCore = lazy(() => import('./GlobeCore'))
const GEO_URL = '/world-110m.json'
const INLINE_H = 400

/**
 * Every colour the globe is made of, for one theme.
 *
 * These are WebGL material colours. three.js needs literal values — it cannot
 * read `var(--color-…)` the way the rest of the system does — so the sphere,
 * the space behind it and the legend swatches are defined once, here, and
 * handed to the renderer. Keeping them in a single object is what stops the
 * legend from drifting away from what is actually drawn, which is how the old
 * "not available" swatch ended up being a different grey from the continents.
 *
 * The matching design tokens are proposed for src/index.css; that file is owned
 * by another change right now, so the values live here in the meantime.
 */
export interface GlobePalette {
  /** CSS background for the panel the sphere floats in. */
  space: string
  /** Recessed inner shadow, so the panel reads as a window rather than a hole. */
  inset: string
  /** Sphere base colour (the ocean). */
  ocean: string
  /** Self-lit floor, so the unlit limb never fades into the backdrop. */
  oceanEmissive: string
  oceanSpecular: string
  /** Halo — soft edge instead of a cut-out circle. */
  atmosphere: string
  atmosphereAltitude: number
  visited: string
  available: string
  availableHover: string
  visitedHover: string
  /** Countries we do not serve. */
  disabled: string
  /** Country borders, engraved rather than drawn on. */
  stroke: string
}

/**
 * Dark: the planet is the only lit thing in the frame.
 * Light: the same planet seen by day — deep water against a pale sky, which
 *        keeps a bright card from having a black rectangle punched out of it.
 */
const GLOBE_THEME: Record<'light' | 'dark', GlobePalette> = {
  dark: {
    space:
      'radial-gradient(118% 82% at 50% 38%, #0b2f3c 0%, #06202b 34%, #03121a 66%, #010a0f 100%)',
    inset: 'inset 0 12px 32px -16px #000, inset 0 -12px 32px -18px #000',
    ocean: '#12495c',
    oceanEmissive: '#03151d',
    oceanSpecular: '#0d6b78',
    atmosphere: '#5cc2b3',
    atmosphereAltitude: 0.24,
    visited: '#008e7c',
    visitedHover: '#00b39c',
    available: '#34e3b0',
    availableHover: '#8bf5d8',
    disabled: '#24505e',
    stroke: '#071f29',
  },
  light: {
    space:
      'radial-gradient(118% 82% at 50% 38%, #f6fcfb 0%, #e7f3f5 38%, #d3e6ed 72%, #c1d9e4 100%)',
    inset:
      'inset 0 12px 30px -18px rgba(9,48,60,.55), inset 0 -10px 26px -20px rgba(9,48,60,.45)',
    ocean: '#0f4c5c',
    oceanEmissive: '#04212b',
    oceanSpecular: '#1b7f8c',
    atmosphere: '#1aa28e',
    atmosphereAltitude: 0.2,
    visited: '#007365',
    visitedHover: '#008e7c',
    available: '#10b981',
    availableHover: '#34e3b0',
    disabled: '#5b7f8e',
    stroke: '#093542',
  },
}

/**
 * How far back the fullscreen camera has to sit for the whole planet to fit.
 *
 * The field of view is vertical, so on a portrait phone — where the screen is
 * half as wide as it is tall — the sphere was a third wider than the window and
 * the poles were the only part you could ever see. 2.145 is the sphere's radius
 * over the tangent of the half-FOV; the rest is room for the halo and for the
 * header and legend that float over the frame. Anything landscape lands under
 * the old 2.2 and is clamped to it, so desktop framing is untouched.
 */
function fitAltitude(w: number, h: number): number {
  const usable = Math.min(Math.max(w - 40, 160), Math.max(h - 170, 160))
  return Math.max(2.2, (2.145 * 1.12 * h) / usable - 1)
}

/**
 * The theme is a `dark` class on <html> written by ThemeToggle, with no context
 * to subscribe to — so the globe watches the attribute directly rather than
 * being told, and re-tints itself the moment the toggle is pressed.
 */
function useIsDark(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )
  useEffect(() => {
    const root = document.documentElement
    const sync = () => setDark(root.classList.contains('dark'))
    const mo = new MutationObserver(sync)
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })
    sync()
    return () => mo.disconnect()
  }, [])
  return dark
}

interface Props {
  passport: PassportCountry[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function WorldMap({ passport }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [features, setFeatures] = useState<any[]>([])
  const [catalog, setCatalog] = useState<Country[]>([])
  const [geoError, setGeoError] = useState(false)
  const [open, setOpen] = useState(false)
  const inlineRef = useRef<HTMLDivElement>(null)
  const [inlineW, setInlineW] = useState(640)
  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight })
  const isDark = useIsDark()
  const palette = isDark ? GLOBE_THEME.dark : GLOBE_THEME.light

  const loadGeo = () => {
    setGeoError(false)
    fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error('geo')
        return r.json()
      })
      .then((topo) => setFeatures((feature(topo, topo.objects.countries) as any).features))
      .catch(() => setGeoError(true))
  }

  useEffect(loadGeo, [])
  useEffect(() => {
    api.get<Country[]>('/countries').then((r) => setCatalog(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!inlineRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setInlineW(e.contentRect.width)
    })
    ro.observe(inlineRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onR = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    const onK = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('resize', onR)
    window.addEventListener('keydown', onK)
    return () => {
      window.removeEventListener('resize', onR)
      window.removeEventListener('keydown', onK)
    }
  }, [])

  const visited = useMemo(() => {
    const m = new Map<number, string>()
    for (const p of passport) {
      const n = numericFor(p.iso2)
      if (n != null) m.set(n, p.iso2)
    }
    return m
  }, [passport])

  const catalogByNumeric = useMemo(() => {
    const m = new Map<number, Country>()
    for (const c of catalog) {
      const n = numericFor(c.iso2)
      if (n != null) m.set(n, c)
    }
    return m
  }, [catalog])

  const handleClick = (c: Country) => {
    setOpen(false)
    navigate(`/destinations/${c.slug}`)
  }

  const loadingBox = (
    <div className="grid h-full place-items-center text-sm text-slate-soft">
      {t('common.loading')}
    </div>
  )

  /* The swatches are filled from the same palette the renderer uses, so the key
     is always true to the picture. The hairline ring keeps the darkest swatch
     from disappearing into the card in dark mode. */
  const swatch = (color: string) => (
    <span
      aria-hidden
      className="h-3 w-3 shrink-0 rounded-[4px] ring-1 ring-black/10 dark:ring-white/20"
      style={{ background: color }}
    />
  )

  const legend = (
    <>
      <span className="flex items-center gap-1.5">
        {swatch(palette.visited)} {t('account.statusVisited')}
      </span>
      <span className="flex items-center gap-1.5">
        {swatch(palette.available)} {t('account.statusAvailable')}
      </span>
      <span className="flex items-center gap-1.5">
        {swatch(palette.disabled)} {t('account.statusDisabled')}
      </span>
    </>
  )

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 border-b border-line px-4 py-4 text-left transition hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400 sm:px-6 dark:focus-visible:ring-accent-400"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:scale-105 dark:bg-white/10 dark:text-accent-400">
            <Globe2 size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="font-700 leading-tight">{t('account.mapTitle')}</h2>
            {/* Wraps rather than truncating. On a 390px phone the hint does not
                fit on one line in any of the three languages — it read
                "Interaktiv 3D globusni ochish uchu…", and the Russian string is
                longer still — so a single line was always going to clip. Two
                lines is the cap: a long translation can extend the header a
                little, but not push the globe off the first screen. */}
            <p className="line-clamp-2 text-xs leading-snug text-slate-soft">
              {t('account.globeOpenHint')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Below `sm` this pill squeezed the title down to "You…". The same
              count is already on the profile header above. */}
          <span className="hidden sm:inline-flex chip bg-brand-600 text-white shadow-sm shadow-brand-500/30 dark:bg-accent-400 dark:text-brand-900 dark:shadow-accent-400/25">
            {t('account.countriesConnected', { count: visited.size })}
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-xl text-slate-soft ring-1 ring-line transition group-hover:text-brand-600 group-hover:ring-brand-300 dark:group-hover:text-accent-400 dark:group-hover:ring-accent-400/50">
            <Maximize2 size={16} />
          </span>
        </div>
      </button>

      {/* inline 3D globe — the panel is a lit window, not a black box: the space
          behind the planet is darkest exactly where the sphere's limb crosses
          it, which is what makes the outline read at all. */}
      <div
        ref={inlineRef}
        data-globe-panel
        className="relative isolate"
        style={{ height: INLINE_H, background: palette.space, boxShadow: palette.inset }}
      >
        {geoError ? (
          <div className="grid h-full place-items-center gap-3 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
              <AlertTriangle size={22} />
            </span>
            <p className="text-sm text-ink/80">{t('account.mapError')}</p>
            <button onClick={loadGeo} className="btn-ghost mx-auto min-h-11 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:focus-visible:ring-accent-400">
              <RotateCw size={15} /> {t('account.retry')}
            </button>
          </div>
        ) : features.length === 0 ? (
          loadingBox
        ) : open ? (
          // Avoid two live WebGL contexts while the fullscreen globe is open.
          <div className="grid h-full place-items-center text-slate-soft">
            <Globe2 size={28} className="opacity-40" />
          </div>
        ) : (
          <Suspense fallback={loadingBox}>
            {/* `rise` is the system's entrance and is already switched off under
                prefers-reduced-motion, so the planet fades up instead of
                snapping in — felt, not watched.
                The label sits here rather than on the panel: `role="img"` makes
                its whole subtree presentational, which would have hidden the
                retry button in the error state from screen readers. */}
            <div className="rise" role="img" aria-label={t('account.globeAria')}>
              <GlobeCore
                features={features}
                catalogByNumeric={catalogByNumeric}
                visited={visited}
                palette={palette}
                width={inlineW}
                height={INLINE_H}
                altitude={2}
                enableZoom={false}
                onCountryClick={handleClick}
              />
            </div>
          </Suspense>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-slate-soft sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{legend}</div>
        <span className="text-slate-soft/80">{t('account.mapHint')}</span>
      </div>

      {/* fullscreen globe */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100]" style={{ background: palette.space }}>
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/40 dark:bg-accent-400 dark:text-brand-900 dark:shadow-accent-400/30">
                  <Globe2 size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-700 leading-tight text-ink">
                    {t('account.globeTitle')}
                  </h2>
                  <p className="truncate text-xs text-slate-soft">{t('account.globeHint')}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/80 ring-1 ring-line backdrop-blur-sm transition hover:bg-ink/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:focus-visible:ring-accent-400"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <Suspense
              fallback={
                <div className="grid h-full place-items-center text-sm text-slate-soft">
                  {t('common.loading')}
                </div>
              }
            >
              <GlobeCore
                features={features}
                catalogByNumeric={catalogByNumeric}
                visited={visited}
                palette={palette}
                width={win.w}
                height={win.h}
                altitude={fitAltitude(win.w, win.h)}
                enableZoom
                onCountryClick={handleClick}
              />
            </Suspense>

            <div className="absolute bottom-5 left-1/2 z-10 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-surface/70 px-4 py-2.5 text-xs text-ink ring-1 ring-line backdrop-blur-md sm:rounded-full sm:px-5">
              {legend}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
