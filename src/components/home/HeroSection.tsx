import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { boot } from '../../lib/boot'
import type { Country } from '../../lib/types'
import Flag from '../Flag'
import HeroArt from './HeroArt'
import { Button } from '../ui'

/* A stable identity for "nothing yet".
 *
 * `?? []` builds a new array on every render, which quietly defeats every
 * useMemo downstream — the filters and sorts below re-run on each keystroke
 * elsewhere in the page. One frozen constant costs nothing and keeps them memoised. */
const NO_COUNTRIES: Country[] = []

/** Three named destinations plus "all of them" fills the two-by-two block
    under the search exactly. */
const QUICK_LINKS = 3

export default function HeroSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  /* The baked catalogue only — no request.
   *
   * This section used to fetch `/countries` for these three links, and so does
   * DestinationsExplorer directly below it: the home page asked the same
   * question twice on every load, for a list of three names that the build
   * already wrote into the document. `boot()` reads that copy synchronously, so
   * the links are on screen in the first paint instead of ~350 ms later, and
   * the home page makes one fewer round trip to Tashkent.
   *
   * If the block is missing the links simply are not drawn; the full grid below
   * is the real answer to "where can I go" and it does fetch. */
  const countries = useMemo(() => boot<Country[]>('countries') ?? NO_COUNTRIES, [])

  const quickLinks = useMemo(() => {
    const popular = countries.filter((c) => c.is_popular)
    return (popular.length ? popular : countries).slice(0, QUICK_LINKS)
  }, [countries])

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/destinations${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  return (
    // `isolate` gives the artwork and the scrim their own stacking context, so
    // the z-10 on the copy below is measured against them and not against the
    // sticky header two levels up.
    <section className="hero-photo relative isolate overflow-hidden">
      <HeroArt />

      <div className="container-page relative z-10 grid items-center gap-10 py-10 sm:py-14 lg:min-h-[590px] lg:grid-cols-2 lg:gap-12 lg:py-24">
        {/* Left — copy + search. min-w-0 is load-bearing: the links below are a
            grid inside a grid item, and a grid item's automatic minimum width
            lets their content size push the whole column — and the headline
            with it — past the viewport, where the section's own overflow-hidden
            quietly crops it. Measured: 672px of column in a 390px screen
            before, 350px after. */}
        <div className="min-w-0 max-w-2xl">
          <h1
            className="max-w-full text-balance font-display text-[1.75rem] font-700 leading-[1.14] text-ink sm:max-w-2xl sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08] rise"
            style={{ animationDelay: '80ms' }}
          >
            {t('home.title1')}{' '}
            {/* Solid ink, not `.text-gradient`.

                The accent half of the headline used to be
                `background-clip: text; color: transparent` over a mint→teal
                gradient that also panned on a 6s loop. Text with no colour has
                no contrast ratio to check; measuring the composited pixels
                instead gave a worst glyph pixel of 1.00:1 in the light theme.
                That is the "rang yutvorgan" the owner reported.

                One colour per theme, both already tokens in index.css and both
                measured against what is actually behind them — which is now a
                photograph, so the scrim in HeroArt is part of that measurement
                rather than a decoration. */}
            <span className="text-brand-600 dark:text-accent-400">{t('home.title2')}</span>
          </h1>
          {/* The search, where the tagline used to be — the owner's actual
              instruction, second attempt. First reading put region chips here;
              they were rejected. The tagline was three adjectives nobody chose
              anything with; the search box is the one control that answers the
              headline's promise, so it earns the spot directly under it. */}
          <form
            onSubmit={search}
            className="mt-6 flex max-w-xl flex-col items-stretch gap-2 rounded-2xl bg-surface p-2 shadow-xl shadow-brand-900/10 ring-1 ring-line rise sm:mt-7 sm:flex-row sm:items-center"
            style={{ animationDelay: '160ms' }}
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

          {/* The quick destinations came out of the globe panel when the globe
              went. They were the keyboard path to what the globe offered — a
              canvas takes no focus — so they are not decoration and could not
              leave with it. Under the search they also reach phones, which the
              panel never did: it was `hidden lg:block`. */}
          {quickLinks.length > 0 && (
            <div className="mt-4 max-w-xl rise" style={{ animationDelay: '240ms' }}>
              {/* `text-ink`, not the muted grey this label wears elsewhere on
                  the site. Elsewhere it sits on a flat surface; here it sits on
                  a photograph, where the muted step measured 2.6:1 against the
                  scrimmed sky on a phone. A label that has to be guessed at is
                  not a label. */}
              <p className="px-1 text-[11px] font-700 uppercase tracking-[0.08em] text-ink/80">
                {t('home.popularTitle')}
              </p>
              <ul
                /* Named so a browser test can assert on *this* list. The home
                   page has a second grid of destination links lower down, and a
                   test that matched both passed while this one was empty —
                   which is the exact failure it was written to catch. */
                aria-label={t('home.quickDestinations')}
                className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {quickLinks.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/destinations/${c.slug}`}
                      className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-xl bg-surface/90 px-3 text-[13px] font-600 text-ink ring-1 ring-line backdrop-blur-sm transition hover:text-brand-600 hover:ring-brand-300 dark:bg-white/10 dark:hover:text-accent-400 dark:hover:ring-accent-400/50"
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
                {/* "Everything else" is not a fourth destination, and it used to
                    look like one: four boxes of the same size, the same weight
                    and the same hairline, so the eye had nothing to sort them
                    by. It keeps the cell and the 44px target and loses the box. */}
                <li>
                  <Link
                    to="/destinations"
                    className="focus-ring group/all flex min-h-11 w-full items-center justify-between gap-1 rounded-xl px-3 text-[13px] font-700 text-brand-700 transition hover:bg-brand-50/70 dark:text-accent-400 dark:hover:bg-white/5"
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
          )}
        </div>

        {/* The right column is deliberately empty on desktop.

            It used to hold a glass card with the WebGL globe in it. The artwork
            behind the whole section already has its subject — the traveller,
            the skyline, a planet — sitting exactly here, and a card drawn on
            top of a photograph of a card is how a page starts looking busy. The
            column stays in the grid because it is what keeps the headline and
            the search on the left half at desktop widths; it simply has nothing
            in it. */}
        <div aria-hidden className="hidden lg:block" />
      </div>
    </section>
  )
}
