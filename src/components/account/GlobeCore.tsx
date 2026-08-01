import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { geoCentroid } from 'd3-geo'
import { useTranslation } from 'react-i18next'
import type { Country } from '../../lib/types'
import type { GlobePalette } from './WorldMap'
import { flagUrl } from '../../lib/format'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  features: any[]
  catalogByNumeric: Map<number, Country>
  visited: Map<number, string>
  /** Every colour of the sphere, for the current theme. Owned by WorldMap so
      the legend and the renderer can never disagree. Type-only import — the
      three.js chunk stays lazy. */
  palette: GlobePalette
  width: number
  height: number
  /** Camera distance. Lower fills more of the frame — the inline panel is a
      letterbox and the planet was lost in it at the default 2.5. */
  altitude?: number
  enableZoom?: boolean
  onCountryClick: (country: Country) => void
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** `#rrggbb` → `rgba(…)`, for the translucent walls of the raised countries. */
function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default function GlobeCore({
  features,
  catalogByNumeric,
  visited,
  palette,
  width,
  height,
  altitude = 2.2,
  enableZoom = true,
  onCountryClick,
}: Props) {
  const { t } = useTranslation()
  const globeEl = useRef<any>(null)
  const [hover, setHover] = useState<any>(null)

  /**
   * The ocean used to be a near-black navy lit only by ambient light, on a
   * near-black panel — so the planet had no silhouette, just a hard cut where
   * the polygons stopped. It is now a deep water teal with an emissive floor:
   * the floor is what keeps the unlit limb a shade above the space behind it,
   * so the sphere stays a sphere all the way round instead of dissolving into
   * the backdrop on its dark side.
   */
  const globeMaterial = useMemo(
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
  useEffect(() => () => globeMaterial.dispose(), [globeMaterial])

  const isVisited = (d: any) => visited.has(Number(d.id))
  const inCatalog = (d: any) => catalogByNumeric.has(Number(d.id))
  const clickable = (d: any) => isVisited(d) || inCatalog(d)

  // flag markers for visited countries
  const flagMarkers = useMemo(() => {
    return features
      .filter((f) => visited.has(Number(f.id)))
      .map((f) => {
        const [lng, lat] = geoCentroid(f)
        return { lat, lng, iso2: visited.get(Number(f.id))! }
      })
      .filter((m) => isFinite(m.lat) && isFinite(m.lng))
  }, [features, visited])

  /**
   * A globe that spins on its own is the one piece of motion on this page that
   * never stops, which is exactly what prefers-reduced-motion is about. It is
   * followed live rather than read once, so turning the setting on stills the
   * planet without a reload.
   */
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const g = globeEl.current
    if (!g) return
    // Cap device pixel ratio — retina globes are very GPU-heavy and can crash the tab.
    try {
      g.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    } catch {
      /* noop */
    }
    g.controls().autoRotate = !reduced
    g.controls().autoRotateSpeed = 0.5
    g.controls().enableZoom = enableZoom
    if (features.length) {
      // Framing is set even with an empty passport: without a pointOfView call
      // the library kept its own default distance and the planet sat small and
      // lonely in the middle of the panel.
      const first = features.find((f) => visited.has(Number(f.id)))
      const [lng, lat] = first ? geoCentroid(first) : [10, 20]
      if (isFinite(lng) && isFinite(lat))
        g.pointOfView({ lat, lng, altitude }, first && !reduced ? 1200 : 0)
    }
  }, [features, visited, enableZoom, reduced, altitude])

  return (
    <Globe
      ref={globeEl}
      width={width}
      height={height}
      animateIn={false}
      backgroundColor="rgba(0,0,0,0)"
      showGlobe
      showAtmosphere
      /* The halo is the soft edge. It is alpha-blended, not additive, so the
         same mechanism reads as a glow against night and as haze against a pale
         sky — a planet with an atmosphere rather than a disc with a border. */
      atmosphereColor={palette.atmosphere}
      atmosphereAltitude={palette.atmosphereAltitude}
      globeMaterial={globeMaterial}
      polygonsData={features}
      polygonAltitude={(d: any) =>
        d === hover ? 0.12 : isVisited(d) ? 0.06 : inCatalog(d) ? 0.03 : 0.008
      }
      polygonCapColor={(d: any) => {
        if (isVisited(d)) return d === hover ? palette.visitedHover : palette.visited
        if (inCatalog(d)) return d === hover ? palette.availableHover : palette.available
        return palette.disabled
      }}
      polygonSideColor={(d: any) =>
        isVisited(d)
          ? withAlpha(palette.visited, 0.4)
          : inCatalog(d)
            ? withAlpha(palette.available, 0.3)
            : withAlpha(palette.stroke, 0.55)
      }
      polygonStrokeColor={() => palette.stroke}
      polygonLabel={(d: any) => {
        // The same three words as the legend below the globe, from the same
        // keys — this tooltip used to be hardcoded English on an Uzbek page.
        const tag = isVisited(d)
          ? `<span style="color:${palette.available}">✓ ${t('account.statusVisited')}</span>`
          : inCatalog(d)
            ? `<span style="color:${palette.available}">→ ${t('account.statusAvailable')}</span>`
            : `<span style="color:#94a7b8">${t('account.statusDisabled')}</span>`
        return `<div style="background:#0b1a22;color:#fff;padding:5px 10px;border-radius:10px;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.5)">${d.properties.name}<div style="font-size:10px;font-weight:500;margin-top:2px">${tag}</div></div>`
      }}
      onPolygonClick={(d: any) => {
        const c = catalogByNumeric.get(Number(d.id))
        if (c) onCountryClick(c)
      }}
      onPolygonHover={(d: any) => {
        setHover(d)
        const el = globeEl.current?.renderer?.()?.domElement
        if (el) el.style.cursor = d && clickable(d) ? 'pointer' : 'default'
      }}
      polygonsTransitionDuration={reduced ? 0 : 260}
      htmlElementsData={flagMarkers}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude={0.07}
      htmlElement={(d: any) => {
        const el = document.createElement('div')
        el.style.pointerEvents = 'none'
        el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-50%)">
          <div style="background:#fff;border:1.5px solid ${palette.visited};border-radius:3px;padding:1px;box-shadow:0 4px 12px rgba(0,0,0,.4)">
            <img src="${flagUrl(d.iso2, 40)}" style="width:22px;height:14px;border-radius:1px;display:block;object-fit:cover"/>
          </div>
          <div style="width:1.5px;height:8px;background:${palette.visited}"></div>
        </div>`
        return el
      }}
    />
  )
}
