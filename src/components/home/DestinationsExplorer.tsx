import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { Country, Region } from '../../lib/types'
import CountryCard from '../CountryCard'
import Flag from '../Flag'
import Reveal from '../Reveal'
import { Button, SectionHeading, ToggleChip } from '../ui'

/** "Which country is calling you?" — region tabs + popular destination grid. */
export default function DestinationsExplorer() {
  const { t } = useTranslation()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [region, setRegion] = useState<string>('')

  useEffect(() => {
    api.get<Country[]>('/countries').then((r) => setCountries(r.data))
    api.get<Region[]>('/regions').then((r) => setRegions(r.data))
  }, [])

  const shown = useMemo(() => {
    const pool = region ? countries.filter((c) => c.region?.slug === region) : countries
    // popular first, then alphabetical, capped to a tidy grid
    return [...pool]
      .sort((a, b) => Number(b.is_popular) - Number(a.is_popular) || a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [countries, region])
  const mobileSuggestions = useMemo(() => {
    const popular = shown.filter((country) => country.is_popular)
    return (popular.length ? popular : shown).slice(0, 6)
  }, [shown])

  return (
    <section className="container-page py-16">
      <SectionHeading align="center" title={t('home.exploreTitle')} subtitle={t('home.exploreSubtitle')} />

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <ToggleChip active={!region} onClick={() => setRegion('')}>
          {t('home.exploreAll')}
        </ToggleChip>
        {regions.map((r) => (
          <ToggleChip key={r.id} active={region === r.slug} onClick={() => setRegion(r.slug)}>
            {r.name}
          </ToggleChip>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-slate-soft">{t('home.exploreEmpty')}</p>
      ) : (
        <>
          <div className="mt-7 sm:hidden">
            <p className="mb-3 text-sm font-700 text-ink">{t('home.popularTitle')}</p>
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
              {mobileSuggestions.map((country) => (
                <Link
                  key={country.id}
                  to={`/destinations/${country.slug}`}
                  className="flex min-w-40 snap-start items-center gap-2.5 rounded-2xl bg-surface px-3 py-3 shadow-sm ring-1 ring-line transition active:scale-[0.98]"
                >
                  <Flag iso2={country.iso2} alt="" className="h-6 w-9 rounded object-cover ring-1 ring-line" />
                  <span className="min-w-0 flex-1 truncate text-sm font-700 text-ink">{country.name}</span>
                  <ChevronRight size={16} className="shrink-0 text-brand-600" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <CountryCard country={c} />
              </Reveal>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex justify-center sm:mt-10">
        <Button to="/destinations" variant="ghost" className="px-6 py-3">
          {t('home.exploreMore')} <ArrowRight size={18} />
        </Button>
      </div>
    </section>
  )
}
