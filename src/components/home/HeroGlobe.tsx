import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { feature } from 'topojson-client'
import * as THREE from 'three'
import { useTranslation } from 'react-i18next'
import type { Country } from '../../lib/types'
import type { GlobePalette } from '../account/WorldMap'
import { numericFor } from '../../lib/isoNumeric'

/* eslint-disable @typescript-eslint/no-explicit-any */

const GEO_URL = '/world-110m.json'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * How far the camera sits back. Lower fills more of the frame: the hero panel
 * is square and the old 2.15 left the planet floating in a wide margin of
 * nothing, which is why it read as a small ornament rather than the subject of
 * the picture.
 */
const ALTITUDE = 1.95

/**
 * The hero planet is the profile planet.
 *
 * Same sphere, same halo, same two-tone continents — a visitor who buys an eSIM
 * and then opens their profile should recognise the same object, not meet a
 * second, differently-coloured Earth. The type comes from the profile globe so
 * that a colour added there cannot be silently missed here; the values are a
 * copy, because WorldMap.tsx is owned by another change and cannot be edited to
 * export them. Extracting `GLOBE_THEME` into a shared module is the real fix —
 * see the note returned with this change.
 *
 * `space`/`inset` are the profile card's own backdrop and `visited*` needs a
 * passport, neither of which exists on the landing page: the hero globe floats
 * on the hero card and its visitor is usually signed out.
 */
export type HeroGlobePalette = Omit<
  GlobePalette,
  'space' | 'inset' | 'visited' | 'visitedHover'
>

const HERO_THEME: Record<'light' | 'dark', HeroGlobePalette> = {
  dark: {
    ocean: '#12495c',
    oceanEmissive: '#03151d',
    oceanSpecular: '#0d6b78',
    atmosphere: '#5cc2b3',
    atmosphereAltitude: 0.24,
    available: '#34e3b0',
    availableHover: '#8bf5d8',
    disabled: '#24505e',
    stroke: '#071f29',
  },
  light: {
    ocean: '#0f4c5c',
    oceanEmissive: '#04212b',
    oceanSpecular: '#1b7f8c',
    atmosphere: '#1aa28e',
    atmosphereAltitude: 0.2,
    available: '#10b981',
    availableHover: '#34e3b0',
    disabled: '#5b7f8e',
    stroke: '#093542',
  },
}

/** `#rrggbb` → `rgba(…)`, for the translucent walls of the raised countries. */
function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/**
 * The label is handed to the globe library as a string and set with innerHTML,
 * so the country name is escaped on the way in. It comes from the bundled
 * atlas rather than from anything a visitor can type, but a value that reaches
 * innerHTML unescaped is a habit worth not having.
 */
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
}

/**
 * The tooltip is not ours: `float-tooltip`, underneath react-globe.gl, injects
 * `.float-tooltip-kap { padding:3px 5px; border-radius:3px; background:rgba(0,0,0,.6) }`
 * globally and drops our chip inside it. The result was a themed surface sitting
 * in a black box — a white card in a black frame in the light theme — which is
 * exactly the "two things where there should be one" look the hero is trying to
 * shed. Stripping the wrapper back to a bare positioner lets the chip below be
 * the only visible object.
 *
 * Scoped to this globe by the `data-hero-globe` attribute rather than written
 * into index.css, so the profile globe keeps the tooltip it was designed with.
 * `max-width` is raised from the library's `max(50%, 150px)`, which wrapped
 * longer country names onto three lines inside a 360px panel.
 */
const TOOLTIP_RESET = `
[data-hero-globe] .float-tooltip-kap {
  padding: 0;
  border-radius: 0;
  background: none;
  color: inherit;
  font: inherit;
  max-width: min(16rem, 92%);
}
`

/**
 * three.js needs literal colours — it cannot read `var(--color-…)` — so the
 * renderer has to be told when the theme flips. ThemeToggle writes a `dark`
 * class on <html> and there is no context to subscribe to, so the globe watches
 * the attribute directly, exactly as the profile one does.
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

/** Followed live, so the setting stills the planet without a reload. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export interface HeroGlobePick {
  /** The country as the atlas names it. Present even for places we do not sell. */
  name: string
  /** The catalogue entry, or null when this is not a destination we sell. */
  country: Country | null
}

interface Props {
  size: number
  /**
   * The catalogue. Empty — on a phone, or before the request lands — renders
   * the decorative planet: one tone of land, no labels, no clicks. A globe that
   * offers to be clicked before it knows what is for sale would answer "we do
   * not sell that" for every country on Earth.
   */
  countries?: Country[]
  /** Wire up dragging, hover labels and clicks. */
  interactive?: boolean
  onPick?: (pick: HeroGlobePick) => void
}

export default function HeroGlobe({ size, countries = [], interactive = false, onPick }: Props) {
  const { t } = useTranslation()
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [features, setFeatures] = useState<any[]>([])
  const [hover, setHover] = useState<any>(null)
  const [pointerOver, setPointerOver] = useState(false)
  const dark = useIsDark()
  const reduced = useReducedMotion()
  const palette = dark ? HERO_THEME.dark : HERO_THEME.light

  const catalogByNumeric = useMemo(() => {
    const m = new Map<number, Country>()
    for (const c of countries) {
      const n = numericFor(c.iso2)
      if (n != null) m.set(n, c)
    }
    return m
  }, [countries])

  const live = interactive && catalogByNumeric.size > 0
  const sold = (d: any) => catalogByNumeric.has(Number(d.id))

  /**
   * A deep water teal with an emissive floor rather than a flat fill: the floor
   * keeps the unlit limb a shade above whatever is behind it, so the sphere
   * stays a sphere all the way round instead of dissolving into the card.
   */
  const material = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: new THREE.Color(palette.ocean),
        emissive: new THREE.Color(palette.oceanEmissive),
        specular: new THREE.Color(palette.oceanSpecular),
        shininess: 14,
      }),
    [palette],
  )

  // A new material per theme switch; the replaced one holds GPU memory.
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    fetch(GEO_URL)
      .then((response) => response.json())
      .then((topology) => setFeatures((feature(topology, topology.objects.countries) as any).features))
      .catch(() => setFeatures([]))
  }, [])

  /**
   * Framing, once per mount.
   *
   * `live` turns on a beat after the planet appears — it waits for the
   * catalogue — and this used to be one effect keyed on it, so the camera was
   * yanked back to its starting longitude a few hundred milliseconds into the
   * spin. On a slow connection the jump was half a continent. Nothing the
   * visitor did caused it, which is precisely what makes it read as a fault
   * rather than as motion.
   */
  const framed = useRef(false)
  useEffect(() => {
    const globe = globeRef.current
    if (!globe || features.length === 0 || framed.current) return
    try {
      const controls = globe.controls()
      controls.autoRotateSpeed = 0.55
      controls.enableZoom = false
      controls.enablePan = false
      globe.pointOfView({ lat: 18, lng: 45, altitude: ALTITUDE }, 0)
      framed.current = true
    } catch {
      // The lightweight fallback remains visible while WebGL initializes.
    }
  }, [features])

  // Sharpness and dragging do follow `live`, and can be changed under the
  // visitor without anything appearing to move.
  useEffect(() => {
    const globe = globeRef.current
    if (!globe || features.length === 0) return
    try {
      // Retina globes are very GPU-heavy. The clickable one is worth the extra
      // sharpness; the phone's is a 25%-opacity backdrop and is not.
      globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, live ? 1.5 : 1.2))
      // Draggable only once it is a control. Behind the hero copy on a phone it
      // would steal the page's own scroll gesture.
      globe.controls().enableRotate = live
    } catch {
      /* noop */
    }
  }, [features, live])

  /**
   * The spin stops while the pointer is on the planet — aiming at a country
   * that is walking away from the cursor is the difference between a control
   * and a toy — and stops outright under prefers-reduced-motion.
   */
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    try {
      globe.controls().autoRotate = !reduced && !(live && pointerOver)
    } catch {
      /* noop */
    }
  }, [features, live, pointerOver, reduced])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !globeRef.current) return
    const update = (visible: boolean) => {
      const globe = globeRef.current
      if (!globe) return
      if (visible && !document.hidden) globe.resumeAnimation()
      else globe.pauseAnimation()
    }
    const observer = new IntersectionObserver(([entry]) => update(entry.isIntersecting), {
      rootMargin: '80px',
      threshold: 0.01,
    })
    const onVisibility = () => update(container.getBoundingClientRect().bottom > 0)
    observer.observe(container)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [features])

  /* Built from the design tokens rather than the hardcoded slate the profile
     tooltip uses, so it is a surface in the current theme instead of a black
     chip stuck on a white page.

     The words are the profile globe's own — `account.statusAvailable` and
     `account.statusDisabled`, the two labels under its legend. They already
     exist in all three languages, they are the vocabulary a visitor will meet
     again on their profile, and taking them from one place is what stops the
     two globes from describing the same colour with different words. (The
     `home.globe*` keys this used to ask for were never added to the locale
     files, so the tooltip was rendering the literal string
     "home.globeUnavailable" on the live page.)

     The dot is filled from the palette the renderer is actually using, the way
     the profile legend's swatches are, so the tooltip teaches the colour code
     instead of needing a legend beside the globe. It carries a hairline ring
     because `disabled` in the dark palette is barely a shade off the dark
     surface behind it. */
  const label = (d: any) => {
    if (!live) return ''
    const yes = sold(d)
    const dot = `<span aria-hidden="true" class="mt-px h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/25" style="background:${yes ? palette.available : palette.disabled}"></span>`
    const text = yes
      ? `<span class="text-status-good-ink">${esc(t('account.statusAvailable'))}</span>`
      : `<span class="text-slate-soft">${esc(t('account.statusDisabled'))}</span>`
    return `<div class="pointer-events-none rounded-xl bg-surface px-3 py-2 text-left ring-1 ring-line elev-2">
      <div class="text-[13px] font-700 leading-tight text-ink">${esc(d.properties?.name ?? '')}</div>
      <div class="mt-1 flex items-start gap-1.5 text-[11px] font-600 leading-tight">${dot}${text}</div>
    </div>`
  }

  return (
    <div
      ref={containerRef}
      data-hero-globe
      className="relative"
      style={{ width: size, height: size }}
      onPointerEnter={() => setPointerOver(true)}
      onPointerLeave={() => {
        setPointerOver(false)
        setHover(null)
      }}
    >
      {/* React 19 hoists and de-duplicates this into <head>; the selector is
          scoped to this component's container either way. */}
      <style href="hero-globe-tooltip" precedence="medium">
        {TOOLTIP_RESET}
      </style>
      {features.length === 0 && (
        <div className="absolute inset-[18%] animate-pulse rounded-full bg-brand-500/15 ring-1 ring-accent-400/20 motion-reduce:animate-none" />
      )}
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        animateIn={false}
        backgroundColor="rgba(0,0,0,0)"
        rendererConfig={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        showGlobe
        showAtmosphere
        /* Alpha-blended, not additive, so the same halo reads as a glow against
           the night card and as haze against the pale one. */
        atmosphereColor={palette.atmosphere}
        atmosphereAltitude={palette.atmosphereAltitude}
        globeMaterial={material}
        polygonsData={features}
        polygonAltitude={(d: any) => (d === hover ? 0.12 : sold(d) ? 0.03 : 0.008)}
        polygonCapColor={(d: any) => {
          if (!live) return palette.available
          if (sold(d)) return d === hover ? palette.availableHover : palette.available
          return palette.disabled
        }}
        polygonSideColor={(d: any) =>
          !live || sold(d) ? withAlpha(palette.available, 0.3) : withAlpha(palette.stroke, 0.55)
        }
        polygonStrokeColor={() => palette.stroke}
        polygonLabel={label}
        onPolygonClick={(d: any) => {
          if (!live) return
          onPick?.({ name: d.properties?.name ?? '', country: catalogByNumeric.get(Number(d.id)) ?? null })
        }}
        onPolygonHover={(d: any) => {
          if (!live) return
          setHover(d)
          const el = globeRef.current?.renderer?.()?.domElement
          // Every country answers a click — the ones we do not sell say so —
          // so every country gets the cursor that promises one.
          if (el) el.style.cursor = d ? 'pointer' : 'grab'
        }}
        polygonsTransitionDuration={reduced ? 0 : 260}
      />
    </div>
  )
}
