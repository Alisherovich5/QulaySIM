import { useEffect, useMemo, useState } from 'react'
import { PriceTag } from '../ui'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { Country, Region } from '../../lib/types'
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
          <div className="mt-7">
            <p className="mb-3 text-sm font-700 text-ink">{t('home.popularTitle')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {shown.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <Link
                  to={`/destinations/${c.slug}`}
                  className="group relative isolate flex min-h-[164px] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-line bg-surface p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-brand-50/45 hover:shadow-xl hover:shadow-brand-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 sm:min-h-[188px] sm:rounded-[1.5rem] sm:p-5 dark:border-white/10 dark:bg-[#0c2831] dark:shadow-black/20 dark:hover:border-accent-400/45 dark:hover:bg-white/[0.04] dark:hover:shadow-black/35 dark:focus-visible:ring-accent-400 dark:focus-visible:ring-offset-[#06141a]"
                >
                  <span
                    aria-hidden
                    className={`absolute right-4 top-4 -z-10 h-32 w-32 rounded-full transition duration-300 group-hover:scale-110 ${i % 3 === 1
                      ? 'bg-[radial-gradient(circle,rgba(241,217,138,.30)_0%,transparent_68%)]'
                      : 'bg-[radial-gradient(circle,rgba(52,227,176,.28)_0%,transparent_68%)]'
                      }`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <Flag iso2={c.iso2} alt="" className="h-9 w-14 rounded-lg object-cover shadow-sm ring-1 ring-line" />
                    {c.is_popular && (
                      <span className="hidden rounded-full bg-accent-400/15 px-2.5 py-1 text-[11px] font-700 text-brand-700 sm:inline-flex dark:text-accent-300">
                        {t('plan.mostPopular')}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 sm:mt-5">
                    <p className="truncate font-display text-base font-700 text-ink sm:text-xl">{c.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-soft sm:text-sm">{c.region?.name}</p>
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t border-line pt-3 sm:mt-5 sm:pt-4">
                    <span>
                      <small className="block text-xs text-slate-soft">{t('common.from')}</small>
                      <PriceTag usd={c.starting_price} size="sm" className="text-brand-600 dark:text-accent-300" />
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-200 group-hover:bg-brand-600 group-hover:text-white sm:h-9 sm:w-9 dark:bg-white/10 dark:text-accent-300 dark:group-hover:bg-accent-400 dark:group-hover:text-brand-950">
                      <ArrowUpRight size={16} className="sm:hidden" />
                      <ArrowUpRight size={18} className="hidden sm:block" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
            </div>
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
