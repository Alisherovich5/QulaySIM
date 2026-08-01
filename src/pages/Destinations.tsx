import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Country, Region } from '../lib/types'
import CountryCard from '../components/CountryCard'
import Reveal from '../components/Reveal'
import { Card } from '../components/ui'

export default function Destinations() {
  const [params, setParams] = useSearchParams()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const search = params.get('search') || ''
  const region = params.get('region') || ''

  useEffect(() => {
    api.get<Region[]>('/regions').then((r) => setRegions(r.data))
  }, [i18n.language])

  useEffect(() => {
    setLoading(true)
    api
      .get<Country[]>('/countries', {
        params: { search: search || undefined, region: region || undefined },
      })
      .then((r) => setCountries(r.data))
      .finally(() => setLoading(false))
  }, [search, region, i18n.language])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const heading = useMemo(() => {
    if (search) return t('destinations.resultsFor', { query: search })
    if (region) return regions.find((r) => r.slug === region)?.name || t('destinations.title')
    return t('destinations.allDestinations')
  }, [search, region, regions, t])

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-2xl font-700 sm:text-3xl">{t('destinations.title')}</h1>
      <p className="mt-2 leading-6 text-slate-soft">{t('destinations.subtitle')}</p>

      <div className="mt-7 flex items-center gap-2 rounded-2xl bg-surface p-2 ring-1 ring-line">
        <div className="flex flex-1 items-center gap-2 pl-3">
          <Search size={20} className="text-slate-soft" />
          <input
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder={t('destinations.searchPlaceholder')}
            className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-soft/70"
          />
        </div>
      </div>

      <div className="mobile-scroll-gutter mt-5 flex items-center gap-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-0">
        <span className="flex shrink-0 items-center gap-1.5 pr-1 text-sm font-600 text-slate-soft">
          <SlidersHorizontal size={15} /> {t('destinations.region')}
        </span>
        <button
          onClick={() => updateParam('region', '')}
          className={`chip focus-ring min-h-11 shrink-0 ring-1 transition ${
            !region ? 'bg-brand-500 text-white ring-brand-500' : 'bg-surface text-slate-soft ring-line hover:ring-brand-300'
          }`}
        >
          {t('destinations.all')}
        </button>
        {regions.map((r) => (
          <button
            key={r.id}
            onClick={() => updateParam('region', r.slug)}
            className={`chip focus-ring min-h-11 shrink-0 ring-1 transition ${
              region === r.slug
                ? 'bg-brand-500 text-white ring-brand-500'
                : 'bg-surface text-slate-soft ring-line hover:ring-brand-300'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-12 text-slate-soft">{t('destinations.loading')}</p>
      ) : (
        <>
          <h2 className="mt-10 text-lg font-700">{heading}</h2>
          {countries.length === 0 ? (
            <Card className="mt-5 p-10 text-center text-slate-soft">
              {t('destinations.noMatch')}
            </Card>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c, i) => (
                <Reveal key={c.id} delay={i * 40}>
                  <CountryCard country={c} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
