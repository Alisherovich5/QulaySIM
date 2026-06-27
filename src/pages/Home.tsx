import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Globe2,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Country } from '../lib/types'
import CountryCard from '../components/CountryCard'
import Reveal from '../components/Reveal'
import Counter from '../components/Counter'

export default function Home() {
  const [popular, setPopular] = useState<Country[]>([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    api.get<Country[]>('/countries', { params: { popular: true } }).then((r) => setPopular(r.data))
  }, [])

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/destinations${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  const steps = [
    { icon: Search, title: t('home.step1Title'), text: t('home.step1Text') },
    { icon: QrCode, title: t('home.step2Title'), text: t('home.step2Text') },
    { icon: Smartphone, title: t('home.step3Title'), text: t('home.step3Text') },
  ]
  const why = [
    { icon: Globe2, title: t('home.why1Title'), text: t('home.why1Text') },
    { icon: Zap, title: t('home.why2Title'), text: t('home.why2Text') },
    { icon: ShieldCheck, title: t('home.why3Title'), text: t('home.why3Text') },
    { icon: Smartphone, title: t('home.why4Title'), text: t('home.why4Text') },
  ]
  const stats = [
    { to: 200, suffix: '+', label: t('home.statDestinations'), decimals: 0 },
    { to: 30, suffix: 'M+', label: t('home.statTravellers'), decimals: 0 },
    { to: 4.8, suffix: '', label: t('home.statRating'), decimals: 1 },
    { to: 60, suffix: 's', label: t('home.statActivation'), decimals: 0 },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900">
        <div className="aurora" />
        <div className="hero-grid" />
        <div className="container-page relative py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip mx-auto bg-white/10 text-white ring-1 ring-white/15 rise">
              <Star size={12} className="text-accent-400" /> {t('home.badge')}
            </span>
            <h1
              className="mt-6 font-display text-4xl font-700 leading-tight text-white sm:text-5xl lg:text-6xl rise"
              style={{ animationDelay: '80ms' }}
            >
              {t('home.title1')}
              <br />
              <span className="text-gradient">{t('home.title2')}</span>
            </h1>
            <p
              className="mx-auto mt-5 max-w-xl text-lg text-brand-100 rise"
              style={{ animationDelay: '160ms' }}
            >
              {t('home.subtitle')}
            </p>

            <form
              onSubmit={search}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-surface p-2 shadow-2xl shadow-brand-900/40 rise"
              style={{ animationDelay: '240ms' }}
            >
              <div className="flex flex-1 items-center gap-2 pl-3">
                <Search size={20} className="text-slate-soft" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full bg-transparent py-2.5 text-ink outline-none placeholder:text-slate-soft/70"
                />
              </div>
              <button type="submit" className="btn-primary sheen px-6 py-3">
                {t('home.findPlans')} <ArrowRight size={18} />
              </button>
            </form>

            <div
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100 rise"
              style={{ animationDelay: '320ms' }}
            >
              <span className="flex items-center gap-1.5">
                <Zap size={15} className="text-accent-400" /> {t('home.instantDelivery')}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-accent-400" /> {t('home.secureCheckout')}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={15} className="text-accent-400" /> {t('home.coverage')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="relative border-t border-white/10 bg-brand-900/60 backdrop-blur">
          <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-700 text-white">
                  <Counter to={s.to} suffix={s.suffix} decimals={s.decimals} />
                </p>
                <p className="mt-1 text-sm text-brand-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="container-page py-16">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-700 sm:text-3xl">{t('home.popularTitle')}</h2>
              <p className="mt-2 text-slate-soft">{t('home.popularSubtitle')}</p>
            </div>
            <Link to="/destinations" className="hidden items-center gap-1 font-600 text-brand-600 hover:gap-2 sm:flex">
              {t('common.viewAll')} <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              <CountryCard country={c} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-surface py-16">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <h2 className="text-2xl font-700 sm:text-3xl">{t('home.howTitle')}</h2>
              <p className="mx-auto mt-2 max-w-lg text-slate-soft">{t('home.howSubtitle')}</p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className="card group p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/5">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-110">
                    <s.icon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-700">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-soft">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why FastSIM */}
      <section className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
                  <f.icon size={20} />
                </span>
                <div>
                  <h3 className="font-700 text-ink">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-soft">{f.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-12 text-center">
            <div className="aurora" style={{ opacity: 0.7 }} />
            <div className="relative">
              <h2 className="font-display text-3xl font-700 text-white">{t('home.ctaTitle')}</h2>
              <p className="mx-auto mt-3 max-w-md text-brand-100">{t('home.ctaSubtitle')}</p>
              <Link to="/destinations" className="btn-accent sheen mx-auto mt-6 w-fit px-7 py-3">
                {t('common.browseDestinations')} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
