import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { feature } from 'topojson-client'
import * as THREE from 'three'

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function HeroGlobe({ size = 250 }: { size?: number }) {
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [countries, setCountries] = useState<any[]>([])

  const material = useMemo(
    () => new THREE.MeshPhongMaterial({
      color: '#073743',
      emissive: '#031419',
      emissiveIntensity: 0.28,
      shininess: 16,
    }),
    [],
  )

  useEffect(() => {
    fetch('/world-110m.json')
      .then((response) => response.json())
      .then((topology) => setCountries((feature(topology, topology.objects.countries) as any).features))
      .catch(() => setCountries([]))
  }, [])

  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    try {
      globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2))
      const controls = globe.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.65
      controls.enableZoom = false
      controls.enablePan = false
      controls.enableRotate = false
      globe.pointOfView({ lat: 18, lng: 45, altitude: 2.15 }, 0)
    } catch {
      // The lightweight fallback remains visible while WebGL initializes.
    }
  }, [countries])

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
  }, [countries])

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-full" style={{ width: size, height: size }}>
      {countries.length === 0 && <div className="absolute inset-[16%] animate-pulse rounded-full bg-brand-500/15 ring-1 ring-accent-400/20" />}
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        animateIn={false}
        backgroundColor="rgba(0,0,0,0)"
        rendererConfig={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        showGlobe
        showAtmosphere
        atmosphereColor="#34e3b0"
        atmosphereAltitude={0.16}
        globeMaterial={material}
        globeCurvatureResolution={6}
        polygonsData={countries}
        polygonAltitude={() => 0.009}
        polygonCapColor={() => '#118b7b'}
        polygonSideColor={() => 'rgba(3, 28, 35, .72)'}
        polygonStrokeColor={() => 'rgba(153, 246, 228, .68)'}
        polygonsTransitionDuration={0}
      />
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_25%,rgba(255,255,255,.16),transparent_30%)]" />
    </div>
  )
}
