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
    <div className="grid h-full place-items-center text-sm text-white/60">{t('common.loading')}</div>
  )

  const legend = (
    <>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-brand-500" /> {t('account.statusVisited')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-accent-500" /> {t('account.statusAvailable')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm" style={{ background: '#1b2535' }} />{' '}
        {t('account.statusDisabled')}
      </span>
    </>
  )

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 border-b border-line px-4 py-4 text-left transition hover:bg-mist sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Globe2 size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-700 leading-tight">{t('account.mapTitle')}</h2>
            <p className="truncate text-xs text-slate-soft">{t('account.globeOpenHint')}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden min-[380px]:inline-flex chip bg-brand-500 text-white shadow-sm shadow-brand-500/30">
            {t('account.countriesConnected', { count: visited.size })}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-lg text-slate-soft ring-1 ring-line transition group-hover:text-brand-600 group-hover:ring-brand-300">
            <Maximize2 size={16} />
          </span>
        </div>
      </button>

      {/* inline 3D globe */}
      <div ref={inlineRef} className="relative bg-[#070d18]" style={{ height: INLINE_H }}>
        {geoError ? (
          <div className="grid h-full place-items-center gap-3 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
              <AlertTriangle size={22} />
            </span>
            <p className="text-sm text-white/70">{t('account.mapError')}</p>
            <button onClick={loadGeo} className="btn-ghost mx-auto px-4 py-2 text-sm">
              <RotateCw size={15} /> {t('account.retry')}
            </button>
          </div>
        ) : features.length === 0 ? (
          loadingBox
        ) : open ? (
          // Avoid two live WebGL contexts while the fullscreen globe is open.
          <div className="grid h-full place-items-center text-sm text-white/50">
            <Globe2 size={28} className="opacity-40" />
          </div>
        ) : (
          <Suspense fallback={loadingBox}>
            <GlobeCore
              features={features}
              catalogByNumeric={catalogByNumeric}
              visited={visited}
              width={inlineW}
              height={INLINE_H}
              enableZoom={false}
              onCountryClick={handleClick}
            />
          </Suspense>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-slate-soft sm:px-6">
        <div className="flex flex-wrap items-center gap-4">{legend}</div>
        <span className="text-slate-soft/80">{t('account.mapHint')}</span>
      </div>

      {/* fullscreen globe */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-[#070b14]">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5 text-white">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 shadow-lg shadow-brand-500/40">
                  <Globe2 size={18} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-700 leading-tight">
                    {t('account.globeTitle')}
                  </h2>
                  <p className="text-xs text-white/60">{t('account.globeHint')}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl text-white/80 ring-1 ring-white/15 transition hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <Suspense
              fallback={
                <div className="grid h-full place-items-center text-sm text-white/70">
                  {t('common.loading')}
                </div>
              }
            >
              <GlobeCore
                features={features}
                catalogByNumeric={catalogByNumeric}
                visited={visited}
                width={win.w}
                height={win.h}
                enableZoom
                onCountryClick={handleClick}
              />
            </Suspense>

            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-4 rounded-full bg-white/10 px-5 py-2 text-xs text-white backdrop-blur-md ring-1 ring-white/10">
              {legend}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
