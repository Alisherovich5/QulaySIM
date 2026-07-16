import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { geoCentroid } from 'd3-geo'
import type { Country } from '../../lib/types'
import { flagUrl } from '../../lib/format'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  features: any[]
  catalogByNumeric: Map<number, Country>
  visited: Map<number, string>
  width: number
  height: number
  enableZoom?: boolean
  onCountryClick: (country: Country) => void
}

// status colors
const C_VISITED = '#008e7c' // status 2 — user has connected
const C_AVAILABLE = '#34e3b0' // status 1 — we have plans
const C_DISABLED = '#1b2535' // status 3 — not served (disabled)

export default function GlobeCore({
  features,
  catalogByNumeric,
  visited,
  width,
  height,
  enableZoom = true,
  onCountryClick,
}: Props) {
  const globeEl = useRef<any>(null)
  const [hover, setHover] = useState<any>(null)

  const globeMaterial = useMemo(
    () => new THREE.MeshPhongMaterial({ color: '#0f1d33', shininess: 8 }),
    [],
  )

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

  useEffect(() => {
    const g = globeEl.current
    if (!g) return
    // Cap device pixel ratio — retina globes are very GPU-heavy and can crash the tab.
    try {
      g.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    } catch {
      /* noop */
    }
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.5
    g.controls().enableZoom = enableZoom
    if (features.length) {
      const first = features.find((f) => visited.has(Number(f.id)))
      if (first) {
        const [lng, lat] = geoCentroid(first)
        if (isFinite(lng) && isFinite(lat)) g.pointOfView({ lat, lng, altitude: 2.2 }, 1200)
      }
    }
  }, [features, visited, enableZoom])

  return (
    <Globe
      ref={globeEl}
      width={width}
      height={height}
      animateIn={false}
      backgroundColor="rgba(0,0,0,0)"
      showGlobe
      showAtmosphere
      atmosphereColor="#008e7c"
      atmosphereAltitude={0.18}
      globeMaterial={globeMaterial}
      polygonsData={features}
      polygonAltitude={(d: any) =>
        d === hover ? 0.12 : isVisited(d) ? 0.06 : inCatalog(d) ? 0.03 : 0.008
      }
      polygonCapColor={(d: any) => {
        if (isVisited(d)) return d === hover ? '#34e3b0' : C_VISITED
        if (inCatalog(d)) return d === hover ? '#7df0d3' : C_AVAILABLE
        return C_DISABLED
      }}
      polygonSideColor={(d: any) =>
        isVisited(d) ? 'rgba(0,142,124,0.25)' : inCatalog(d) ? 'rgba(52,227,176,0.2)' : 'rgba(20,30,45,0.4)'
      }
      polygonStrokeColor={() => '#0a0f1a'}
      polygonLabel={(d: any) => {
        const tag = isVisited(d)
          ? '<span style="color:#34e3b0">✓ visited</span>'
          : inCatalog(d)
            ? '<span style="color:#5cc2b3">→ view plans</span>'
            : '<span style="color:#5b6478">not available</span>'
        return `<div style="background:#0e1525;color:#fff;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.45)">${d.properties.name}<div style="font-size:10px;font-weight:500;margin-top:2px">${tag}</div></div>`
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
      polygonsTransitionDuration={260}
      htmlElementsData={flagMarkers}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude={0.07}
      htmlElement={(d: any) => {
        const el = document.createElement('div')
        el.style.pointerEvents = 'none'
        el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-50%)">
          <div style="background:#fff;border:1.5px solid #008e7c;border-radius:3px;padding:1px;box-shadow:0 4px 12px rgba(0,0,0,.4)">
            <img src="${flagUrl(d.iso2, 40)}" style="width:22px;height:14px;border-radius:1px;display:block;object-fit:cover"/>
          </div>
          <div style="width:1.5px;height:8px;background:#008e7c"></div>
        </div>`
        return el
      }}
    />
  )
}
