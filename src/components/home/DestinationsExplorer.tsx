import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { Country, Region } from '../../lib/types'
import Flag from '../Flag'
import Reveal from '../Reveal'
import { Button, Card, PriceTag } from '../ui'

/**
 * A region with nothing promoted falls back to plain browsing, and a whole
 * continent of cards would bury the rest of the landing page. Only that browse
 * list is capped — the promoted list never is.
 */
const BROWSE_LIMIT = 12

const GRID = 'grid grid-cols-2 gap-2.5 min-[360px]:grid-cols-3 sm:gap-4 lg:gap-5'

const TITLE_ID = 'home-destinations-title'

/**
 * The count is the strongest fact in the section and was reading as an ordinary
 * heading. Setting it at display scale means finding it inside the heading
 * string rather than storing it apart, so the words around it stay exactly
 * where the translator put them and every language keeps its own order:
 * "200+ countries", "200 dan ortiq mamlakatlar", "Более 200 стран".
 */
const COUNT_IN_TITLE = /\d+(?:[ .,\u00A0\u202F]\d{3})*\+?/

function splitOnCount(title: string) {
  const match = COUNT_IN_TITLE.exec(title)
  // A heading with no numeral in it still has to render, so it falls back to
  // the whole string set at the ordinary size.
  if (!match) return { before: title, count: '', after: '' }
  return {
    before: title.slice(0, match.index).trim(),
    count: match[0],
    after: title.slice(match.index + match[0].length).trim(),
  }
}

const CARD_SHAPE =
  'min-h-[122px] rounded-2xl border border-line sm:min-h-[176px] sm:rounded-3xl lg:min-h-[188px] dark:border-white/10'

/** "Which country is calling you?" — region tabs + popular destination grid. */
export default function DestinationsExplorer() {
  const { t, i18n } = useTranslation()
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  // The region filter moved up into the hero, and from there it leads to the
  // full catalogue — so this section stopped being a browser and went back to
  // being what its data actually is: the promoted list, curated in the admin.
  useEffect(() => {
    api
      .get<Country[]>('/countries')
      .then((r) => setCountries(r.data))
      // A catalogue that never arrives should land on the empty state, not sit
      // on the placeholders forever.
      .catch(() => setCountries([]))
      .finally(() => setLoading(false))
  }, [i18n.language])

  // Region names are admin-owned catalogue data and arrive in English, which is
  // wrong on an Uzbek page. The slug is the stable key; the API's own name is
  // the fallback so a region added later still reads as a name, not a raw key.
  const regionLabel = (r: Region) => t(`region.${r.slug}`, { defaultValue: r.name })

  const { shown, promoted } = useMemo(() => {
    const popular = countries.filter((c) => c.is_popular)
    // No cap here: the promoted list is curated in the admin, so trimming it to
    // a round number silently dropped whichever destination sorted last. The
    // API already returns it in the admin's own order, so it is not re-sorted
    // either — that order is the business's ranking, not an accident.
    if (popular.length > 0) return { shown: popular, promoted: true }
    // A catalogue with nothing promoted still shows what it has, capped so a
    // whole continent of cards does not bury the rest of the landing page.
    return { shown: countries.slice(0, BROWSE_LIMIT), promoted: false }
  }, [countries])

  // Only the promoted list may claim to be the popular one.
  const gridTitle = promoted ? t('home.popularTitle') : t('destinations.allDestinations')

  const title = t('home.exploreTitle')
  const { before, count, after } = splitOnCount(title)

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
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-16">
          <h2
            id={TITLE_ID}
            aria-label={title}
            className="max-w-2xl font-display text-[1.75rem] font-700 leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-5xl"
          >
            {before && <span>{before} </span>}
            {count && (
              <span className="tabular-nums text-brand-600 dark:text-accent-400">{count}</span>
            )}
            {after && <span> {after}</span>}
          </h2>

          <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-soft lg:mt-0 lg:max-w-sm lg:shrink-0 lg:border-l lg:border-line lg:pl-10">
            {t('home.exploreSubtitle')}
          </p>
        </div>
      </Reveal>

      <div className="mt-8 sm:mt-10">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <span aria-hidden className="h-4 w-1 rounded-full bg-accent-400" />
          <p className="text-sm font-700 text-ink">{gridTitle}</p>
        </div>

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
        ) : shown.length === 0 ? (
          <Card className="p-8 text-center text-slate-soft sm:p-10">{t('home.exploreEmpty')}</Card>
        ) : (
          <div className={GRID}>
            {shown.map((c, i) => (
              // The stagger is capped: the list is no longer eight items long,
              // and a card that waits half a second reads as a slow page.
              <Reveal key={c.id} delay={Math.min(i, 5) * 45} className="h-full">
                <Link
                  to={`/destinations/${c.slug}`}
                  className={`${CARD_SHAPE} group relative isolate flex h-full flex-col justify-between overflow-hidden bg-surface p-2.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-brand-50/45 hover:shadow-xl hover:shadow-brand-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-0 active:scale-[0.99] sm:p-4 lg:p-5 dark:shadow-black/20 dark:hover:border-accent-400/45 dark:hover:bg-white/[0.04] dark:hover:shadow-black/35 dark:focus-visible:ring-accent-400`}
                >
                  <span
                    aria-hidden
                    className={`absolute -right-5 -top-5 -z-10 h-24 w-24 rounded-full opacity-80 transition duration-500 group-hover:scale-125 group-hover:opacity-100 sm:-right-7 sm:-top-7 sm:h-36 sm:w-36 ${
                      i % 3 === 1
                        ? 'bg-[radial-gradient(circle,rgba(241,217,138,.30)_0%,transparent_68%)]'
                        : 'bg-[radial-gradient(circle,rgba(52,227,176,.28)_0%,transparent_68%)]'
                    }`}
                  />
                  <Flag
                    iso2={c.iso2}
                    alt=""
                    className="h-7 w-10 rounded-md object-cover shadow-sm ring-1 ring-line transition duration-300 group-hover:ring-brand-200 sm:h-9 sm:w-14 sm:rounded-lg lg:h-10 lg:w-16 dark:ring-white/15"
                  />

                  <div className="mt-2.5 sm:mt-4">
                    {/* The region is the first thing to go at three-up: the flag
                        and the name already identify the destination. */}
                    {c.region && (
                      <p className="hidden truncate text-[11px] font-600 text-slate-soft sm:block">
                        {regionLabel(c.region)}
                      </p>
                    )}
                    <p className="truncate font-display text-[13px] font-700 leading-tight text-ink sm:mt-0.5 sm:text-lg lg:text-xl">
                      {c.name}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-line pt-2 sm:mt-4 sm:pt-3.5">
                    <span className="min-w-0">
                      <small className="hidden text-[11px] text-slate-soft sm:block">{t('common.from')}</small>
                      <PriceTag usd={c.starting_price} size="xs" className="text-brand-600 dark:text-accent-300" />
                    </span>
                    <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-200 group-hover:bg-brand-600 group-hover:text-white sm:grid dark:bg-white/10 dark:text-accent-300 dark:group-hover:bg-accent-400 dark:group-hover:text-brand-950">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>

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
