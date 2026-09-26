import { useId, useMemo } from 'react'
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'

type Feature = { id?: string | number; type: string; geometry: unknown; properties?: unknown }

interface Props {
  /** Country shapes from /world-110m.json, already converted to GeoJSON. */
  features: Feature[]
  /** Visited countries, keyed by their numeric ISO code. */
  visited: Map<number, string>
  dark: boolean
}

/* The two looks, from the same drawing. The sphere is lit from the upper left
   in both, so the limb away from the light is where the continents fade — the
   one cue that makes a flat SVG read as a ball. */
const LOOK = {
  light: {
    sea: ['#e6f8f3', '#b9ebdf', '#7fd3c1'],
    land: '#37b094',
    landOpacity: 0.78,
    visited: '#0a7c69',
    grid: 'rgb(11 124 105 / 0.12)',
    rim: '#5fd1bb',
    marker: '#0bb493',
  },
  dark: {
    sea: ['#123f47', '#0b2d36', '#071d24'],
    land: '#1f7d6d',
    landOpacity: 0.82,
    visited: '#2fe0b6',
    grid: 'rgb(47 224 182 / 0.08)',
    rim: '#19d3ae',
    marker: '#19d3ae',
  },
} as const

const W = 700
const H = 440
const R = 300

/**
 * A digital globe for the travel-map card: simplified continents on a lit
 * sphere, the customer's countries picked out, a marker on each and a dotted
 * route between them.
 *
 * It replaces a live WebGL globe that sat inline on the card. That one drew
 * a photographic planet, cost the page a 1.8 MB chunk and a GPU context before
 * anyone asked for it, and blanked the panel on machines without WebGL. This
 * is a few kilobytes of SVG from data the page already fetched; the real 3D
 * globe still opens full screen on a tap, which is when it earns its weight.
 *
 * Static on purpose. The only motion is a slow pulse on the markers, and that
 * stops under prefers-reduced-motion.
 */
export default function StylizedGlobe({ features, visited, dark }: Props) {
  const uid = useId().replace(/:/g, '')
  const look = dark ? LOOK.dark : LOOK.light

  const drawing = useMemo(() => {
    const byId = new Map(features.map((f) => [Number(f.id), f]))
    const points = [...visited.keys()]
      .map((id) => byId.get(id))
      .filter((f): f is Feature => Boolean(f))
      .map((f) => geoCentroid(f as never) as [number, number])

    // Face the globe towards the customer's own countries; with none yet, the
    // stretch from Europe to Central Asia where this shop's travellers go.
    const centre: [number, number] = points.length
      ? [
          points.reduce((s, p) => s + p[0], 0) / points.length,
          points.reduce((s, p) => s + p[1], 0) / points.length,
        ]
      : [48, 34]
    const projection = geoOrthographic()
      .scale(R)
      .translate([W * 0.56, H * 0.8])
      // Tilted so the customer's countries sit in the upper half of the
      // sphere: the card crops the bottom of the globe, and a marker centred
      // on it fell off the lower edge.
      .rotate([-centre[0], -Math.max(-20, Math.min(35, centre[1] - 16)), 0])
      .clipAngle(90)
    const path = geoPath(projection)

    const land = features.map((f, i) => ({
      d: path(f as never) ?? '',
      visited: visited.has(Number(f.id)),
      key: `${f.id ?? 'x'}-${i}`,
    }))

    // Consecutive markers joined by great-circle arcs, the same curve a flight
    // follows; geoPath clips whatever part runs round the back of the sphere.
    const routes = points.slice(1).map((p, i) =>
      path({ type: 'LineString', coordinates: [points[i], p] } as never) ?? '',
    )

    const markers = points
      .map((p) => projection(p))
      .filter((xy): xy is [number, number] => Array.isArray(xy))

    return {
      sphere: path({ type: 'Sphere' } as never) ?? '',
      grid: path(geoGraticule10() as never) ?? '',
      land,
      routes,
      markers,
    }
  }, [features, visited])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id={`sea-${uid}`} cx="34%" cy="30%" r="78%">
          <stop offset="0%" stopColor={look.sea[0]} />
          <stop offset="55%" stopColor={look.sea[1]} />
          <stop offset="100%" stopColor={look.sea[2]} />
        </radialGradient>
        {/* Light falls off towards the far limb: the land is masked by the
            same gradient, so it fades where the ocean darkens. */}
        <radialGradient id={`fade-${uid}`} cx="36%" cy="32%" r="74%">
          <stop offset="60%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.35" />
        </radialGradient>
        <mask id={`mask-${uid}`}>
          <path d={drawing.sphere} fill={`url(#fade-${uid})`} />
        </mask>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={`dot-${uid}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* A soft halo the sphere sits in, not an atmosphere. */}
      <path d={drawing.sphere} fill="none" stroke={look.rim} strokeWidth="18" opacity="0.28" filter={`url(#glow-${uid})`} />
      <path d={drawing.sphere} fill={`url(#sea-${uid})`} />
      <path d={drawing.grid} fill="none" stroke={look.grid} strokeWidth="0.8" />

      <g mask={`url(#mask-${uid})`}>
        {drawing.land.map((c) => (
          <path
            key={c.key}
            d={c.d}
            fill={c.visited ? look.visited : look.land}
            fillOpacity={c.visited ? 1 : look.landOpacity}
            stroke={dark ? 'rgb(7 29 36 / 0.55)' : 'rgb(255 255 255 / 0.55)'}
            strokeWidth="0.5"
          />
        ))}
      </g>

      <path d={drawing.sphere} fill="none" stroke={look.rim} strokeWidth="1.5" opacity="0.7" />

      {drawing.routes.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={look.marker}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="1 7"
        />
      ))}

      {drawing.markers.map(([x, y], i) => (
        <g key={i} className="sg-marker" style={{ transformOrigin: `${x}px ${y}px` }}>
          <circle cx={x} cy={y} r="16" fill={look.marker} opacity="0.35" filter={`url(#dot-${uid})`} />
          <circle cx={x} cy={y} r="9" fill={dark ? '#071d24' : '#fff'} stroke={look.marker} strokeWidth="3.5" />
          <circle cx={x} cy={y} r="3.5" fill={look.marker} />
        </g>
      ))}
    </svg>
  )
}
