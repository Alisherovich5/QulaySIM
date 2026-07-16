import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { Country, Region } from '../../lib/types'
import CountryCard from '../CountryCard'
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((c, i) => (
            <Reveal key={c.id} delay={i * 40}>
              <CountryCard country={c} />
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Button to="/destinations" variant="ghost" className="px-6 py-3">
          {t('home.exploreMore')} <ArrowRight size={18} />
        </Button>
      </div>
    </section>
  )
}
