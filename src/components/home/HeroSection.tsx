import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPinOff, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { Country } from '../../lib/types'
import type { HeroGlobePick } from './HeroGlobe'
import Flag from '../Flag'
import { Button } from '../ui'

const HeroGlobe = lazy(() => import('./HeroGlobe'))

/** Three named destinations plus "all of them" fills the two-by-two block
    under the globe exactly. */
const QUICK_LINKS = 3
/**
 * The panel is 30rem wide with 1.5rem of padding, so 26rem of it is drawable.
 * The camera sits far enough back that the sphere only fills about three
 * quarters of its canvas: at 320 that made a 235px planet adrift in a 480px
 * card, which is what made it read as an ornament pinned to the corner of a
 * page rather than the subject of one. 360 is the largest square that still
 * leaves the halo clear of the card's rounded edge.
 */
const GLOBE_DESKTOP = 360
const GLOBE_MOBILE = 250

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function getHeroGlobeState() {
  if (typeof window === 'undefined') return { isDesktop: false, webgl: false, reduced: false }

  return {
    isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    webgl: supportsWebGL(),
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

function useHeroGlobe() {
  // Derive the initial value synchronously on the client so desktop users do
  // not briefly see an empty second column before the first effect runs.
  const [globeState, setGlobeState] = useState(getHeroGlobeState)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setGlobeState(getHeroGlobeState())
    update()
    desktop.addEventListener('change', update)
    motion.addEventListener('change', update)
    return () => {
      desktop.removeEventListener('change', update)
      motion.removeEventListener('change', update)
    }
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

interface VisualProps {
  /** False falls back to the still image: no WebGL, or a phone under reduced motion. */
  render: boolean
  size: number
  countries?: Country[]
  interactive?: boolean
  onPick?: (pick: HeroGlobePick) => void
}

function HeroGlobeVisual({ render, size, countries, interactive, onPick }: VisualProps) {
  if (!render) return <GlobeFallback size={size} />

  return (
    <GlobeErrorBoundary fallback={<GlobeFallback size={size} />}>
      <Suspense fallback={<GlobeFallback size={size} />}>
        <HeroGlobe size={size} countries={countries} interactive={interactive} onPick={onPick} />
      </Suspense>
    </GlobeErrorBoundary>
  )
}

export default function HeroSection() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  // The country the visitor asked about that we do not sell. Clicking such a
  // place has to answer something; silence reads as a broken globe. `at` is the
  // moment of the click — clicking the same country twice has to restart the
  // dismissal timer, and only a fresh object identity does that.
  const [missing, setMissing] = useState<{ name: string; at: number } | null>(null)
  const { isDesktop, webgl, reduced } = useHeroGlobe()

  // Only the desktop panel can be clicked, so only the desktop panel pays for
  // the catalogue. The names are localised server-side, hence the language dep.
  useEffect(() => {
    if (!isDesktop) return
    let cancelled = false
    api
      .get<Country[]>('/countries')
      .then((r) => !cancelled && setCountries(r.data))
      // The globe stays decorative and the panel keeps its "browse everything"
      // link: a catalogue that never arrives must not break the hero.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isDesktop, i18n.language])

  // The notice is an answer, not a state to live in — it steps aside for the
  // destination links again shortly after it has been read.
  useEffect(() => {
    if (!missing) return
    const id = window.setTimeout(() => setMissing(null), 7000)
    return () => window.clearTimeout(id)
  }, [missing])

  const quickLinks = useMemo(() => {
    const popular = countries.filter((c) => c.is_popular)
    return (popular.length ? popular : countries).slice(0, QUICK_LINKS)
  }, [countries])

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/destinations${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  const pick = (picked: HeroGlobePick) => {
    if (picked.country) {
      navigate(`/destinations/${picked.country.slug}`)
      return
    }
    setMissing({ name: picked.name, at: Date.now() })
  }

  /**
   * `home.globeAria`, `home.globeHint` and `home.globeNoPlans` are not in the
   * locale files — this section was shipping the literal strings
   * "home.globeHint" and "home.globeNoPlans" onto the live page. They are
   * returned with this change to be added; until they are, each falls back to
   * an existing translated string rather than to English or to a raw key, so
   * the hero reads correctly in all three languages today and picks up the
   * better wording automatically the moment the keys land.
   *
   * The fallback for the "we do not sell that" answer is built from the same
   * label the tooltip and the profile legend use — "Sudan — Mavjud emas". It is
   * a name and its status either side of a dash rather than a sentence, so no
   * language has its word order broken by the composition.
   *
   * The label falls back to `account.mapHint` rather than to
   * `account.globeAria`: that one reads "the countries you have connected to",
   * which is true of the profile globe and false of this one — the hero visitor
   * is usually signed out and there is no passport behind this planet. A
   * screen-reader user was being told the page showed their travel history.
   */
  const globeAria = t('home.globeAria', { defaultValue: t('account.mapHint') })
  const globeHint = t('home.globeHint', { defaultValue: t('account.mapHint') })
  const noPlans = missing
    ? t('home.globeNoPlans', {
        country: missing.name,
        defaultValue: `${missing.name} — ${t('account.statusDisabled')}`,
      })
    : ''

  return (
    // `brand-50` is a ramp step, and the ramps do not flip with the theme: in
    // dark mode the hero opened on a near-white wash (198,213,213) with the
    // headline set in near-white ink on top of it — measured at 1.95:1, which
    // is not a headline, it is a rumour of one. brand-900 is the same hue at
    // the other end of the ramp and hands over to the canvas cleanly.
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-canvas dark:from-brand-900">
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

          Here it is decorative — no catalogue, no labels, no clicks — so it
          stays the still image for devices without WebGL and for anyone who
          asked for reduced motion, where its only purpose, the turning, is off.
          The desktop panel is a control rather than an ornament, so that one is
          kept and simply held still instead. */}
      {!isDesktop && (
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 opacity-[0.25] sm:top-8 sm:opacity-[0.28] lg:hidden dark:opacity-[0.32]">
          <div className="hero-mobile-background-globe">
            <HeroGlobeVisual render={webgl && !reduced} size={GLOBE_MOBILE} />
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

        {/* Desktop keeps the original separate globe panel, preserving the text
            layout. The panel is no longer aria-hidden: what used to be a
            decorative sphere over an invented "your location → your
            destination" caption is now a way of choosing a destination, and the
            caption is the same destinations as links. A canvas takes no focus,
            so those links are the whole keyboard path to what the globe
            offers — they are not decoration and must not be hidden. */}
        <div className="relative hidden lg:block">
          {isDesktop && (
            <div className="relative mx-auto max-w-[30rem]">
              <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-white/65 via-brand-50/55 to-accent-400/10 p-6 shadow-2xl shadow-brand-900/10 ring-1 ring-inset ring-brand-200/45 backdrop-blur-sm dark:from-[#0b3038]/90 dark:via-[#08272f]/90 dark:to-[#061c28]/95 dark:shadow-black/25 dark:ring-white/8">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/20" />
                <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-400/12 blur-3xl dark:bg-accent-400/10" />
                <div className="hero-grid opacity-30 dark:opacity-70" />

                <div className="relative flex min-h-[430px] flex-col items-center gap-4">
                  <div role="img" aria-label={globeAria}>
                    <HeroGlobeVisual
                      render={webgl}
                      size={GLOBE_DESKTOP}
                      countries={countries}
                      interactive
                      onPick={pick}
                    />
                  </div>

                  <div className="mt-auto w-full rounded-2xl bg-surface/75 p-3 ring-1 ring-line backdrop-blur-xl elev-1 dark:bg-white/10 dark:ring-white/10">
                    {/* The answer to a country we do not sell replaces the
                        heading, not the destinations under it: "not this one"
                        is only half an answer, and swapping the whole card out
                        would take the keyboard path away with it.

                        The live region is always in the tree and starts empty,
                        rather than being created at the moment of the click. A
                        `role="status"` node that appears already populated is
                        unreliably announced — several screen readers only read
                        changes to a region they were already watching — and the
                        click that triggers it happens on a canvas, so this
                        announcement is the only thing a non-sighted user would
                        get. The icon stays outside it: it is decoration, and
                        inside the region it would be part of what is read. */}
                    <div className="flex min-h-8 items-center gap-2 px-1">
                      {missing && <MapPinOff size={14} aria-hidden className="shrink-0 text-status-warn-ink" />}
                      {!missing && (
                        <p className="text-[11px] font-700 uppercase tracking-[0.08em] text-slate-soft">
                          {t('home.popularTitle')}
                        </p>
                      )}
                      <p role="status" aria-live="polite" className="text-[12px] font-600 leading-snug text-ink">
                        {noPlans}
                      </p>
                    </div>
                    {/* Two by two rather than a wrapping row: three names of
                        unknown length plus a fourth link never sat on one line
                        at every width, and a lone chip on a second row reads as
                        an accident. */}
                    {/* Two rows' worth of height whether or not the catalogue
                        has arrived, so the panel does not jump under the
                        cursor when it does. */}
                    <ul className="mt-2 grid min-h-24 grid-cols-2 content-start gap-2">
                      {quickLinks.map((c) => (
                        <li key={c.id}>
                          <Link
                            to={`/destinations/${c.slug}`}
                            className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-xl bg-surface px-3 text-[13px] font-600 text-ink ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300 dark:hover:text-accent-400 dark:hover:ring-accent-400/50"
                          >
                            <Flag
                              iso2={c.iso2}
                              alt=""
                              className="h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-line"
                            />
                            <span className="truncate">{c.name}</span>
                          </Link>
                        </li>
                      ))}
                      {/* "Everything else" is not a fourth destination, and it
                          used to look like one: four boxes of the same size,
                          the same weight and the same hairline, so the eye had
                          nothing to sort them by. It keeps the cell and the
                          44px target and loses the box — the contrast between
                          three surfaces and one bare action is the hierarchy,
                          and it takes a border out of a corner of the page that
                          already had nine of them. */}
                      <li className={quickLinks.length ? '' : 'col-span-2'}>
                        <Link
                          to="/destinations"
                          className="focus-ring group/all flex min-h-11 w-full items-center justify-between gap-1 rounded-xl px-3 text-[13px] font-700 text-brand-600 transition hover:bg-brand-50 dark:text-accent-400 dark:hover:bg-white/5"
                        >
                          {t('common.viewAll')}
                          <ArrowRight
                            size={14}
                            className="shrink-0 transition-transform duration-200 group-hover/all:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/all:translate-x-0"
                          />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-slate-soft">{globeHint}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
