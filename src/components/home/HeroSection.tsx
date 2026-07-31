import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui'

const HeroGlobe = lazy(() => import('./HeroGlobe'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function getHeroGlobeState() {
  if (typeof window === 'undefined') return { isDesktop: false, interactive: false }

  return {
    isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    interactive: supportsWebGL() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

function useHeroGlobe() {
  // Derive the initial value synchronously on the client so desktop users do
  // not briefly see an empty second column before the first effect runs.
  const [globeState, setGlobeState] = useState(getHeroGlobeState)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => {
      setGlobeState({
        isDesktop: media.matches,
        interactive: supportsWebGL() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return globeState
}

function GlobeFallback({ size }: { size: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* A picture of the real globe, not a stylised badge.

          This used to be a circle with a Globe2 icon in it, which is a different
          shape from the WebGL globe it stands in for — so a phone showed one
          Earth and a desktop showed another. The image is a capture of the
          actual globe, so the two match, and at 18 kB it costs a thousandth of
          the 1.85 MB the live one does. The mobile hero draws it at 25% opacity
          as a background texture, where running WebGL for it is not a trade
          worth making. */}
      <img
        src="/hero-globe.webp"
        srcSet="/hero-globe.webp 384w, /hero-globe@2x.webp 512w"
        sizes={`${size}px`}
        alt=""
        aria-hidden
        width={size}
        height={size}
        // Decorative and above the fold, so it must not be lazy — a hero that
        // pops in after paint reads as a broken page.
        decoding="async"
        className="h-full w-full select-none object-contain"
        draggable={false}
      />
    </div>
  )
}

class GlobeErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function HeroGlobeVisual({ interactive, size }: { interactive: boolean; size: number }) {
  if (!interactive) return <GlobeFallback size={size} />

  return (
    <GlobeErrorBoundary fallback={<GlobeFallback size={size} />}>
      <Suspense fallback={<GlobeFallback size={size} />}>
        <HeroGlobe size={size} />
      </Suspense>
    </GlobeErrorBoundary>
  )
}

export default function HeroSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { isDesktop, interactive: showInteractiveGlobe } = useHeroGlobe()

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
      {/* On phones the globe stays behind the copy; desktop keeps its dedicated
          visual card.

          The live globe, not a still: it turns, and that motion is the point of
          it. I had swapped phones onto the static image to save the 1.85 MB the
          WebGL bundle costs — but the rotation is a deliberate part of the hero,
          and a frozen Earth is not the same thing. The chunk is still excluded
          from modulePreload, so it loads after the page is usable rather than
          competing with it.

          The still image remains the fallback for devices without WebGL and for
          anyone who asked for reduced motion. */}
      {!isDesktop && (
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 opacity-[0.25] sm:top-8 sm:opacity-[0.28] lg:hidden dark:opacity-[0.32]">
          <div className="hero-mobile-background-globe">
            <HeroGlobeVisual interactive={showInteractiveGlobe} size={250} />
          </div>
        </div>
      )}

      <div className="container-page relative z-10 grid items-center gap-10 py-10 sm:py-14 lg:min-h-[590px] lg:grid-cols-2 lg:gap-12 lg:py-24">
        {/* Left — copy + search */}
        <div className="max-w-2xl">
          <h1
            className="max-w-full text-balance break-words font-display text-[2rem] font-700 leading-[1.12] text-ink sm:max-w-2xl sm:text-5xl lg:text-6xl rise"
            style={{ animationDelay: '80ms' }}
          >
            {t('home.title1')} <span className="text-gradient">{t('home.title2')}</span>
          </h1>
          <p
            className="mt-4 max-w-full break-words text-base leading-6 text-slate-soft sm:mt-5 sm:max-w-xl sm:text-lg sm:leading-7 rise"
            style={{ animationDelay: '160ms' }}
          >
            {t('home.subtitle')}
          </p>

          <form
            onSubmit={search}
            className="mt-7 flex max-w-xl flex-col items-stretch gap-2 rounded-2xl bg-surface p-2 shadow-xl shadow-brand-900/10 ring-1 ring-line rise sm:flex-row sm:items-center"
            style={{ animationDelay: '240ms' }}
          >
            <div className="flex flex-1 items-center gap-2 px-3 sm:pl-3 sm:pr-0">
              <Search size={20} className="text-slate-soft" />
              <input
                id="destination-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                aria-label={t('home.searchPlaceholder')}
                className="w-full bg-transparent py-2.5 text-ink outline-none placeholder:text-slate-soft/70"
              />
            </div>
            <Button
              type="submit"
              sheen
              className="w-full px-5 py-3 shadow-lg shadow-brand-500/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-brand-500/45 active:translate-y-0 sm:w-auto"
            >
              {t('home.findPlans')} <ArrowRight size={18} />
            </Button>
          </form>
        </div>

        {/* Desktop keeps the original separate globe panel, preserving the text layout. */}
        <div className="relative hidden lg:block" aria-hidden>
          {isDesktop && (
            <div className="relative mx-auto max-w-md">
              <div className="group relative min-h-[430px] overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-white/65 via-brand-50/55 to-accent-400/10 shadow-2xl shadow-brand-900/10 ring-1 ring-inset ring-brand-200/45 backdrop-blur-sm dark:from-[#0b3038]/90 dark:via-[#08272f]/90 dark:to-[#061c28]/95 dark:shadow-black/25 dark:ring-white/8">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/20" />
                <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-400/12 blur-3xl dark:bg-accent-400/10" />
                <div className="hero-grid opacity-30 dark:opacity-70" />
                <div className="absolute left-1/2 top-5 -translate-x-1/2 transition duration-500 group-hover:scale-[1.025]">
                  <HeroGlobeVisual interactive={showInteractiveGlobe} size={300} />
                </div>
                <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between rounded-2xl border border-white/70 bg-white/72 p-4 text-ink shadow-xl shadow-brand-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-black/20">
                  <span>
                    <small className="text-slate-soft dark:text-white/50">{t('home.routeFromLabel')}</small>
                    <b className="mt-1 flex items-center gap-1"><MapPin size={14} /> {t('home.routeFrom')}</b>
                  </span>
                  <span className="mx-4 h-px flex-1 bg-brand-300/60 dark:bg-white/20" />
                  <span className="text-right">
                    <small className="text-slate-soft dark:text-white/50">{t('home.routeToLabel')}</small>
                    <b className="mt-1 block">{t('home.routeTo')}</b>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
