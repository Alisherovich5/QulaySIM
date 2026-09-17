import PriceTag from '../PriceTag'
import { useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { Country } from '../../lib/types'
import { destinationPhoto } from '../../lib/destination-media'
import DestinationPhotoBed from '../media/DestinationPhotoBed'
import Flag from '../Flag'
import Reveal from '../Reveal'
import { Button, Card } from '../ui'
import { boot } from '../../lib/boot'
import { useCatalogue } from '../../lib/useCatalogue'
/* A stable identity for "nothing yet".
 *
 * `?? []` builds a new array on every render, which quietly defeats every
 * useMemo downstream — the filters and sorts below re-run on each keystroke
 * elsewhere in the page. One frozen constant costs nothing and keeps them memoised. */
const NO_COUNTRIES: Country[] = []


/**
 * A region with nothing promoted falls back to plain browsing, and a whole
 * continent of cards would bury the rest of the landing page. Only that browse
 * list is capped — the promoted list never is.
 */
const BROWSE_LIMIT = 12

/* Three across is the design's grid at 1536. Held to two between 1024 and
   1279: at three the card is 296px, which leaves 60px of text column once the
   picture has its half — not enough for "Ozarbayjon" at the size the design
   sets the name. */
const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3'

const TITLE_ID = 'home-destinations-title'


const CARD_SHAPE =
  'min-h-[122px] rounded-2xl border border-line sm:min-h-[176px] sm:rounded-3xl lg:min-h-[188px] dark:border-white/10'

/** "Which country is calling you?" — region tabs + popular destination grid. */
export default function DestinationsExplorer() {
  const { t, i18n } = useTranslation()
  // The three steps — baked copy, fresh request, keep what is on screen when
  // the request is lost — live in useCatalogue now. This call site had the
  // third one wrong: it replaced 25 baked countries with an empty list the
  // moment a request was dropped. See lib/catalogue.ts.
  const { data, loading } = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () => api.get<Country[]>('/countries').then((r) => r.data),
    deps: [i18n.language],
  })
  const countries = data ?? NO_COUNTRIES


  // Region names are admin-owned catalogue data and arrive in English, which is
  // wrong on an Uzbek page. The slug is the stable key; the API's own name is
  // the fallback so a region added later still reads as a name, not a raw key.

  const shown = useMemo(() => {
    const popular = countries.filter((c) => c.is_popular)
    // No cap here: the promoted list is curated in the admin, so trimming it to
    // a round number silently dropped whichever destination sorted last. The
    // API already returns it in the admin's own order, so it is not re-sorted
    // either — that order is the business's ranking, not an accident.
    if (popular.length > 0) return popular
    // A catalogue with nothing promoted still shows what it has, capped so a
    // whole continent of cards does not bury the rest of the landing page.
    return countries.slice(0, BROWSE_LIMIT)
  }, [countries])

  /* The filter is over what the section already shows, not a second request.
     The promoted list is nine cards; asking the API for a substring of nine
     rows it has already sent is a round trip for nothing, and it would make
     every keystroke depend on the network. Typing past the promoted list is
     what the destinations page is for, which is where "see all" goes. */
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return shown
    return shown.filter((c) => c.name.toLocaleLowerCase().includes(needle))
  }, [shown, query])

  return (
    <section className="container-page py-12 sm:py-16" aria-labelledby={TITLE_ID}>
      {/* The header used to be a raised panel: a numeral set at 8xl, a blur
          blob behind it, the copy walled off behind a hairline and the filter
          on a recessed strip along the foot — poster chrome, and the owner
          called it what it was. With the filter gone to the hero there is
          nothing here that needs a surface, so the header returns to the page:
          an editorial two-column — display heading left, supporting copy on
          the right hung off a single hairline — with the count carried by
          colour inside the sentence instead of by a font size. The words stay
          in the translator's order; `aria-label` reads the untouched string. */}
      <Reveal>
        {/* The supporting line that used to sit beside the heading is gone by
            the owner's instruction, and that left the row two thirds empty —
            a heading alone above a label alone above the grid. "See all" moves
            up into it: existing content, and it belongs with the heading it
            qualifies rather than at the foot of a list somebody has already
            scrolled past. `home.exploreSubtitle` stays in all three locale
            files, so turning the line back on is one element and not a
            translation round. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <h2
            id={TITLE_ID}
            className="font-display text-[26px] font-800 leading-[1.12] tracking-[-0.02em] text-[#06294a] sm:text-[34px] lg:text-[40px] dark:text-ink"
          >
            {t('home.exploreHeading')}
          </h2>

          {/* Filters the nine cards below rather than navigating: the section is
              a shortlist, and sending somebody to another page to find out it
              has no Peru is a worse answer than showing them it has none. */}
          <div className="relative w-full shrink-0 sm:w-[340px] lg:w-[392px]">
            <Search
              size={19}
              aria-hidden
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-soft"
            />
            <label htmlFor="home-dest-search" className="sr-only">
              {t('home.searchCountry')}
            </label>
            <input
              id="home-dest-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('home.searchCountry')}
              className="focus-ring h-[54px] w-full rounded-[14px] border border-line bg-surface pl-[52px] pr-4 text-[16px] text-ink placeholder:text-slate-soft"
            />
          </div>
        </div>
      </Reveal>

      <div className="mt-8 sm:mt-10">
        {loading ? (
          // Placeholders rather than the empty-state copy: an empty catalogue
          // and a catalogue still in flight are not the same thing to a reader.
          <div className={GRID} aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`${CARD_SHAPE} animate-pulse bg-surface-2 motion-reduce:animate-none`}
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card className="p-8 text-center text-slate-soft sm:p-10">{t('home.exploreEmpty')}</Card>
        ) : (
          <div className={GRID}>
            {visible.map((c, i) => (
              // The stagger is capped: the list is no longer eight items long,
              // and a card that waits half a second reads as a slow page.
              <Reveal key={c.id} delay={Math.min(i, 5) * 45} className="h-full">
                {/* A ticket: flag, name and picture above the perforation, the
                    price and the button on the stub below it. The shape — the
                    notch bitten out of each edge — is cut in destinations.css,
                    with the reason it is a mask and not two circles. */}
                <article className={`dest-card h-full ${i === 0 ? 'is-featured' : ''}`}>
                  <div className="dest-top">
                    <Flag iso2={c.iso2} alt="" className="dest-flag" />
                    <p className="dest-name">{c.name}</p>

                    {/* The picture of the place, where there is one. No stand-in
                        where there is not: a generic travel image under a
                        country name is a claim about somewhere the visitor is
                        about to buy data for. */}
                    {destinationPhoto(c.slug) && (
                      <span className="dest-art" aria-hidden>
                        <DestinationPhotoBed slug={c.slug} />
                      </span>
                    )}
                  </div>

                  <hr className="dest-split" />

                  <div className="dest-foot">
                    <span className="min-w-0">
                      <small className="dest-from block">{t('home.startingFrom')}</small>
                      <PriceTag usd={c.starting_price} size="xs" className="dest-price" />
                    </span>
                    <Link
                      to={`/destinations/${c.slug}`}
                      className="dest-cta dest-hit focus-ring"
                      aria-label={`${c.name} — ${t('home.choose')}`}
                    >
                      {t('home.choose')}
                      <ArrowRight size={17} aria-hidden />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Centred under the grid, at every width: in the design it closes the
          section rather than sitting beside the heading that opens it. */}
      <div className="mt-8 flex justify-center sm:mt-10">
        <Button
          to="/destinations"
          variant="ghost"
          className="group px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-accent-400"
        >
          {t('home.exploreMore')}{' '}
          <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </section>
  )
}
