import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Globe2, MapPin, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '../ui'

const HeroGlobe = lazy(() => import('./HeroGlobe'))

export default function HeroSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/destinations${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-canvas">
      {/* soft decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl"
      />

      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        {/* Left — copy + search */}
        <div>
          <Badge tone="muted" className="rise">
            <Sparkles size={13} /> {t('home.heroEyebrow')}
          </Badge>
          <h1
            className="mt-5 font-display text-4xl font-700 leading-[1.1] text-ink sm:text-5xl lg:text-6xl rise"
            style={{ animationDelay: '80ms' }}
          >
            {t('home.title1')} <span className="text-gradient">{t('home.title2')}</span>
          </h1>
          <p
            className="mt-5 max-w-lg text-lg text-slate-soft rise"
            style={{ animationDelay: '160ms' }}
          >
            {t('home.subtitle')}
          </p>

          <form
            onSubmit={search}
            className="mt-7 flex max-w-md items-center gap-2 rounded-2xl bg-surface p-2 shadow-xl shadow-brand-900/10 ring-1 ring-line rise"
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
            <Button type="submit" sheen className="px-5 py-3">
              {t('home.findPlans')} <ArrowRight size={18} />
            </Button>
          </form>

          <div
            className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-soft rise"
            style={{ animationDelay: '320ms' }}
          >
            <span className="flex items-center gap-1.5">
              <Zap size={15} className="text-accent-500" /> {t('home.instantDelivery')}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-accent-500" /> {t('home.secureCheckout')}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 size={15} className="text-accent-500" /> {t('home.coverage')}
            </span>
          </div>

        </div>

        {/* Right — optimized Variant 3 globe */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto max-w-md">
            <div className="group relative min-h-[430px] overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-white/65 via-brand-50/55 to-accent-400/10 shadow-2xl shadow-brand-900/10 ring-1 ring-inset ring-brand-200/45 backdrop-blur-sm dark:from-[#0b3038]/90 dark:via-[#08272f]/90 dark:to-[#061c28]/95 dark:shadow-black/25 dark:ring-white/8">
              <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/20" />
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-400/12 blur-3xl dark:bg-accent-400/10" />
              <div aria-hidden className="hero-grid opacity-30 dark:opacity-70" />
              <div className="absolute left-1/2 top-5 -translate-x-1/2 transition duration-500 group-hover:scale-[1.025]">
                <Suspense fallback={<div className="h-[300px] w-[300px] animate-pulse rounded-full bg-brand-500/15" />}>
                  <HeroGlobe size={300} />
                </Suspense>
              </div>
              <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between rounded-2xl border border-white/70 bg-white/72 p-4 text-ink shadow-xl shadow-brand-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-black/20">
                <span>
                  <small className="text-slate-soft dark:text-white/50">Boshlanish</small>
                  <b className="mt-1 flex items-center gap-1"><MapPin size={14} /> Siz turgan joy</b>
                </span>
                <span className="mx-4 h-px flex-1 bg-brand-300/60 dark:bg-white/20" />
                <span className="text-right">
                  <small className="text-slate-soft dark:text-white/50">Manzil</small>
                  <b className="mt-1 block">Safar manzilingiz</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
