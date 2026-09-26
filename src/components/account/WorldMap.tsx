import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { feature } from 'topojson-client'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Globe2, Maximize2, RotateCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Country, PassportCountry } from '../../lib/types'
import { numericFor } from '../../lib/isoNumeric'
import Flag from '../Flag'
import { GlobeErrorBoundary } from '../GlobeErrorBoundary'
import { api } from '../../lib/api'
import { GLOBE_THEME, type GlobePalette } from '../../lib/globe-theme'
import { PlaneIcon } from '../ui'
import StylizedGlobe from './StylizedGlobe'

// Re-exported so GlobeCore's type-only import keeps working from either file.
export type { GlobePalette }

// Heavy (three.js) — only loaded when this account tab renders / globe opens.
const GlobeCore = lazy(() => import('./GlobeCore'))
const GEO_URL = '/world-110m.json'

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
  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight })
  const isDark = useIsDark()

  /* The inline 3D globe, mounted only once the card is near the screen.
   *
   * It is a 1.8 MB chunk and a WebGL context. Loaded with the page, every
   * visit to the account paid for it, including the ones that never scroll
   * down to it; loaded as the card approaches, it is ready by the time it is
   * seen. Until then — and on any device where WebGL fails — the SVG globe
   * holds the space, so there is never an empty box. */
  const boxRef = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) }),
    )
    ro.observe(el)
    return () => {
      io.disconnect()
      ro.disconnect()
    }
  }, [features.length, geoError])
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
    <section className="tm-card" aria-labelledby="tm-title">
      <div className="tm-grid">
        <div className="tm-copy">
          <div className="flex items-start gap-4">
            <span className="tm-icon" aria-hidden>
              <Globe2 size={26} />
            </span>
            <div className="min-w-0">
              <h2 id="tm-title" className="tm-title">
                {t('account.mapTitle')}
              </h2>
              <p className="tm-sub">{t('account.globeOpenHint')}</p>
            </div>
          </div>
          <p className="tm-body">{t('account.mapBody')}</p>
          <button type="button" onClick={() => setOpen(true)} className="tm-cta focus-ring">
            {t('account.countriesConnected', { count: visited.size })}
            <PlaneIcon size={18} aria-hidden />
          </button>
        </div>

        {/* The globe. A live 3D one once the card is near, the SVG drawing
            until then and wherever WebGL is missing. The canvas is taller than
            the card and anchored to its top, so the planet rises from the
            bottom edge the way the design has it, cropped rather than shrunk. */}
        <div ref={boxRef} className="tm-globe">
          {geoError ? (
            <div className="grid h-full place-items-center gap-3 p-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle size={22} />
              </span>
              <p className="text-sm text-ink/80">{t('account.mapError')}</p>
              <button onClick={loadGeo} className="btn-ghost focus-ring mx-auto min-h-11 px-4 py-2 text-sm">
                <RotateCw size={15} /> {t('account.retry')}
              </button>
            </div>
          ) : (
            <>
              {(() => {
                const flat =
                  features.length === 0 ? (
                    <span className="tm-globe-skeleton" aria-hidden />
                  ) : (
                    <div className="tm-globe-flat">
                      <StylizedGlobe features={features} visited={visited} dark={isDark} />
                    </div>
                  )
                // One WebGL context at a time: while the full-screen globe is
                // open, the card falls back to the drawing.
                if (!near || open || features.length === 0 || box.w === 0) return flat
                const stageH = Math.round(box.h * 1.35)
                return (
                  <div className="tm-globe-stage" style={{ height: stageH }}>
                    <GlobeErrorBoundary fallback={flat}>
                      <Suspense fallback={flat}>
                        <div className="rise" role="img" aria-label={t('account.globeAria')}>
                          <GlobeCore
                            features={features}
                            catalogByNumeric={catalogByNumeric}
                            visited={visited}
                            palette={palette}
                            width={box.w}
                            height={stageH}
                            altitude={box.w < 500 ? 2.3 : 2.1}
                            enableZoom={false}
                            onCountryClick={handleClick}
                          />
                        </div>
                      </Suspense>
                    </GlobeErrorBoundary>
                  </div>
                )
              })()}

              {/* On a touch screen a drag on the globe would turn the planet
                  instead of scrolling the page, so there the whole picture is
                  one button into the full-screen globe, where turning it is
                  the point. With a mouse, this layer is not there. */}
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t('account.globeOpenHint')}
                className="tm-globe-tap focus-ring"
              />
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t('account.globeTitle')}
                title={t('account.globeTitle')}
                className="tm-expand focus-ring"
              >
                <Maximize2 size={17} aria-hidden />
              </button>
              {passport.length > 0 && (
                <button type="button" onClick={() => setOpen(true)} className="tm-chip focus-ring">
                  <span className="flex -space-x-2">
                    {passport.slice(0, 3).map((c) => (
                      <Flag key={c.iso2} iso2={c.iso2} className="h-7 w-7 rounded-full object-cover ring-2 ring-surface" />
                    ))}
                  </span>
                  <span className="font-700 text-ink">
                    {t('global.card.countries', { count: passport.length })}
                  </span>
                  <ChevronRight size={16} className="text-slate-soft" aria-hidden />
                </button>
              )}
            </>
          )}
        </div>
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

            <GlobeErrorBoundary
              fallback={
                <div className="grid h-full place-items-center text-sm text-slate-soft">
                  {t('account.globeUnavailable')}
                </div>
              }
            >
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
            </GlobeErrorBoundary>

            <div className="absolute bottom-5 left-1/2 z-10 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-surface/70 px-4 py-2.5 text-xs text-ink ring-1 ring-line backdrop-blur-md sm:rounded-full sm:px-5">
              {legend}
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
