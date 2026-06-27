import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clapperboard,
  Coffee,
  Gauge,
  Search,
  Wifi,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Country, CountryDetail, Plan } from '../lib/types'
import { dataLabel, formatPrice } from '../lib/format'
import { useCart } from '../context/CartContext'
import Flag from '../components/Flag'
import Counter from '../components/Counter'
import Reveal from '../components/Reveal'

type Profile = 'light' | 'medium' | 'heavy'
const PER_DAY_MB: Record<Profile, number> = { light: 512, medium: 1024, heavy: 2560 }
const BUFFER = 1.15
const PRESETS = [3, 7, 14, 30]

function recommend(plans: Plan[], neededMB: number, days: number) {
  const unlimited = plans.find((p) => p.is_unlimited)
  const covering = plans
    .filter((p) => !p.is_unlimited && p.data_amount_mb >= neededMB)
    .sort((a, b) => {
      const av = a.validity_days >= days ? 0 : 1
      const bv = b.validity_days >= days ? 0 : 1
      return av - bv || a.price_usd - b.price_usd
    })
  if (covering.length) return { plan: covering[0], covers: true }
  if (unlimited) return { plan: unlimited, covers: true }
  const largest = [...plans].filter((p) => !p.is_unlimited).sort((a, b) => b.data_amount_mb - a.data_amount_mb)[0]
  return { plan: largest ?? null, covers: false }
}

export default function Calculator() {
  const { t } = useTranslation()
  const { add } = useCart()
  const [countries, setCountries] = useState<Country[]>([])
  const [slug, setSlug] = useState<string>('')
  const [detail, setDetail] = useState<CountryDetail | null>(null)
  const [days, setDays] = useState(7)
  const [profile, setProfile] = useState<Profile>('medium')
  const [added, setAdded] = useState(false)

  // country search dropdown
  const [query, setQuery] = useState('')
  const [openList, setOpenList] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<Country[]>('/countries').then((r) => setCountries(r.data))
  }, [])

  useEffect(() => {
    if (!slug) {
      setDetail(null)
      return
    }
    api.get<CountryDetail>(`/countries/${slug}`).then((r) => setDetail(r.data))
  }, [slug])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpenList(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = useMemo(
    () =>
      countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [countries, query],
  )

  const estimatedMB = days * PER_DAY_MB[profile]
  const neededMB = Math.round(estimatedMB * BUFFER)
  const estimatedGB = estimatedMB / 1024

  const rec = useMemo(
    () => (detail ? recommend(detail.plans, neededMB, days) : null),
    [detail, neededMB, days],
  )

  const profiles: { key: Profile; icon: typeof Coffee; label: string; desc: string }[] = [
    { key: 'light', icon: Coffee, label: t('calc.light'), desc: t('calc.lightDesc') },
    { key: 'medium', icon: Gauge, label: t('calc.medium'), desc: t('calc.mediumDesc') },
    { key: 'heavy', icon: Clapperboard, label: t('calc.heavy'), desc: t('calc.heavyDesc') },
  ]

  const handleAdd = () => {
    if (!rec?.plan || !detail) return
    add(rec.plan, detail.name, detail.iso2)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div>
      {/* header */}
      <section className="relative overflow-hidden bg-brand-900">
        <div className="aurora" />
        <div className="hero-grid" />
        <div className="container-page relative py-14 text-center">
          <span className="chip mx-auto bg-white/10 text-white ring-1 ring-white/15">
            <Gauge size={12} className="text-accent-400" /> {t('calc.badge')}
          </span>
          <h1 className="mt-5 font-display text-3xl font-700 text-white sm:text-4xl">
            {t('calc.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">{t('calc.subtitle')}</p>
        </div>
      </section>

      <div className="container-page grid gap-6 py-12 lg:grid-cols-[1fr_420px]">
        {/* Inputs */}
        <div className="space-y-6">
          {/* 1. destination */}
          <Reveal>
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-sm font-700 text-brand-600">
                  1
                </span>
                <h2 className="font-700">{t('calc.step1')}</h2>
              </div>
              <div ref={boxRef} className="relative mt-4">
                <div className="flex items-center gap-2 rounded-xl px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
                  {detail ? (
                    <Flag iso2={detail.iso2} className="h-5 w-7 rounded object-cover ring-1 ring-line" />
                  ) : (
                    <Search size={18} className="text-slate-soft" />
                  )}
                  <input
                    value={openList ? query : detail?.name ?? ''}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setOpenList(true)
                    }}
                    onFocus={() => setOpenList(true)}
                    placeholder={t('calc.selectCountry')}
                    className="w-full bg-transparent py-3 outline-none placeholder:text-slate-soft/70"
                  />
                </div>
                {openList && filtered.length > 0 && (
                  <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl bg-surface p-1 shadow-xl shadow-brand-900/10 ring-1 ring-line">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSlug(c.slug)
                          setOpenList(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-mist"
                      >
                        <Flag iso2={c.iso2} className="h-4 w-6 rounded object-cover ring-1 ring-line" />
                        <span className="flex-1 font-600 text-ink">{c.name}</span>
                        <span className="text-xs text-slate-soft">
                          {t('common.from')} {formatPrice(c.starting_price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* 2. duration */}
          <Reveal delay={60}>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-sm font-700 text-brand-600">
                    2
                  </span>
                  <h2 className="font-700">{t('calc.step2')}</h2>
                </div>
                <span className="font-display text-xl font-700 text-brand-600">
                  {days} <span className="text-sm text-slate-soft">{t('calc.daysUnit')}</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-5 w-full accent-brand-500"
              />
              <div className="mt-3 flex gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setDays(p)}
                    className={`chip ring-1 transition ${
                      days === p
                        ? 'bg-brand-500 text-white ring-brand-500'
                        : 'bg-surface text-slate-soft ring-line hover:ring-brand-300'
                    }`}
                  >
                    {p} {t('calc.daysUnit')}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 3. usage profile */}
          <Reveal delay={120}>
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-sm font-700 text-brand-600">
                  3
                </span>
                <h2 className="font-700">{t('calc.step3')}</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {profiles.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setProfile(p.key)}
                    className={`rounded-xl p-4 text-left ring-1 transition ${
                      profile === p.key
                        ? 'bg-brand-50 ring-2 ring-brand-500'
                        : 'bg-surface ring-line hover:ring-brand-300'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg ${
                        profile === p.key ? 'bg-brand-500 text-white' : 'bg-mist text-slate-soft'
                      }`}
                    >
                      <p.icon size={18} />
                    </span>
                    <p className="mt-3 font-700 text-ink">{p.label}</p>
                    <p className="mt-0.5 text-xs text-slate-soft">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Result */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="relative overflow-hidden bg-brand-900 px-6 py-7 text-center text-white">
              <div className="aurora" style={{ opacity: 0.6 }} />
              <div className="relative">
                <p className="text-sm text-brand-100">{t('calc.estimatedTitle')}</p>
                <p className="mt-1 font-display text-5xl font-700">
                  <Counter to={estimatedGB} decimals={estimatedGB < 10 ? 1 : 0} suffix=" GB" />
                </p>
                <p className="mt-1 text-sm text-brand-100">
                  {t('calc.estimatedFor', { days })}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
                  <Wifi size={12} className="text-accent-400" />
                  {t('calc.perDay', { amount: dataLabel(PER_DAY_MB[profile], false) })}
                </div>
              </div>
            </div>

            <div className="p-6">
              {!detail ? (
                <p className="py-8 text-center text-sm text-slate-soft">{t('calc.pickCountry')}</p>
              ) : rec?.plan ? (
                <>
                  <p className="text-xs font-600 uppercase tracking-wide text-slate-soft">
                    {t('calc.recommendedPlan')}
                  </p>
                  <div className="mt-3 rounded-xl bg-mist p-4 ring-1 ring-line">
                    <div className="flex items-center gap-3">
                      <Flag iso2={detail.iso2} className="h-8 w-11 rounded object-cover ring-1 ring-line" />
                      <div className="flex-1">
                        <p className="font-700 text-ink">
                          {rec.plan.is_unlimited ? t('plan.unlimited') : dataLabel(rec.plan.data_amount_mb, false)}
                          <span className="ml-1.5 text-xs font-500 text-slate-soft">
                            · {rec.plan.network_type} · {rec.plan.validity_days} {t('calc.daysUnit')}
                          </span>
                        </p>
                        <p className="text-sm text-slate-soft">{detail.name}</p>
                      </div>
                      <p className="font-display text-xl font-700 text-brand-600">
                        {formatPrice(rec.plan.price_usd)}
                      </p>
                    </div>
                    {!rec.covers && (
                      <p className="mt-3 rounded-lg bg-amber-signal/10 px-3 py-2 text-xs text-amber-signal">
                        {t('calc.notCoverNote')}
                      </p>
                    )}
                  </div>

                  <button onClick={handleAdd} className="btn-primary sheen mt-4 w-full py-3">
                    {added ? <Check size={18} /> : null}
                    {added ? t('plan.added') : t('calc.addToCart')}
                  </button>
                  <Link
                    to={`/destinations/${detail.slug}`}
                    className="mt-2 flex items-center justify-center gap-1 py-2 text-sm font-600 text-brand-600 hover:gap-2"
                  >
                    {t('calc.viewAllPlans')} <ArrowRight size={15} />
                  </Link>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-slate-soft">{t('calc.noPlans')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
