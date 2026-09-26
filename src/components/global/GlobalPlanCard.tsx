import { CalendarDays, Check, ChevronRight, Globe2, Users, Wifi } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PlaneIcon } from '../ui'
import { useCurrency } from '../../context/CurrencyContext'
import { useDesignCopy } from '../../lib/design-copy'
import type { Plan } from '../../lib/types'

interface Props {
  plan: Plan
  onAdd: (plan: Plan) => void
  added: boolean
  onCoverage: (plan: Plan) => void
}

/**
 * A worldwide plan, as the /global grid shows it.
 *
 * Its own component rather than a variant of PlanCard: that card is also the
 * home page teaser and the route planner, and this layout — the country count
 * beside the price, a filled button, the coverage link under it — is for this
 * page only. Changing PlanCard would have changed those two pages as well.
 *
 * The cards in a row share a height, and the price, button and link sit at the
 * foot of each, so they line up across the row however long a title runs.
 */
export default function GlobalPlanCard({ plan, onAdd, added, onCoverage }: Props) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const c = useDesignCopy()
  const covered = plan.coverage?.length ?? 0
  // The catalogue fills `price_note` on worldwide plans with the country count
  // ("66 ta davlat"), which this card already shows beside the price. Printed
  // as well, it said the same number twice; any other note is still shown.
  const note = plan.price_note?.trim() ?? ''
  const noteRepeatsCount = covered > 0 && Number.parseInt(note, 10) === covered

  return (
    <article className="group/card relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-surface p-5 ring-1 ring-line shadow-[0_1px_2px_rgb(15_40_50/0.04),0_12px_28px_-20px_rgb(15_40_50/0.25)] transition hover:ring-brand-300 sm:p-6">
      {/* A faint globe behind the figures: this is a plan for many countries,
          and the card says so before a word is read. Decoration only. */}
      <Globe2
        aria-hidden
        strokeWidth={0.9}
        className="pointer-events-none absolute -right-12 top-10 -z-10 h-48 w-48 text-brand-500/[0.045] dark:text-accent-400/[0.05]"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-600 text-ink">
          <Globe2 size={18} className="text-brand-600 dark:text-accent-400" aria-hidden />
          {t('global.card.label')}
        </span>
        <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-700 text-brand-700 dark:bg-brand-800/40 dark:text-accent-400">
          {plan.network_type}
        </span>
      </div>

      <h3 className="gpc-data mt-3 font-display font-800 text-ink">
        {plan.is_unlimited ? t('plan.unlimited') : plan.data_label}
      </h3>
      <p className="gpc-sub mt-2 text-slate-soft">{plan.title}</p>

      <dl className="mt-5 grid grid-cols-2 border-b border-line pb-4">
        <div className="flex min-w-0 gap-2.5 pr-3">
          <CalendarDays size={18} className="mt-0.5 shrink-0 text-slate-soft" aria-hidden />
          <div className="min-w-0">
            <dt className="text-[13px] text-slate-soft">{c.duration}</dt>
            <dd className="mt-0.5 text-[15px] font-600 text-ink">
              {t('global.table.days', { count: plan.validity_days })}
            </dd>
          </div>
        </div>
        <div className="flex min-w-0 gap-2.5 border-l border-line pl-4">
          <Wifi size={18} className="mt-0.5 shrink-0 text-slate-soft" aria-hidden />
          <div className="min-w-0">
            <dt className="text-[13px] text-slate-soft">{c.hotspot}</dt>
            <dd className="mt-0.5 text-[15px] font-600 text-ink">
              {plan.supports_hotspot ? c.included : t('global.card.noHotspot')}
            </dd>
          </div>
        </div>
      </dl>

      {/* Pushed to the foot, so price, button and link line up across a row. */}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <p className="gpc-price font-display font-800 tabular-nums text-ink">
            {formatPrice(plan.price_usd)}
          </p>
          {covered > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-soft">
              <Users size={18} className="text-brand-500 dark:text-accent-400" aria-hidden />
              {t('global.card.countries', { count: covered })}
            </span>
          )}
        </div>
        {note && !noteRepeatsCount && <p className="gpc-note mt-1 text-slate-soft">{note}</p>}

        <button
          type="button"
          onClick={() => onAdd(plan)}
          disabled={added}
          className="focus-ring mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-[15px] font-700 text-white transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-default"
        >
          {added ? (
            <>
              <Check size={17} aria-hidden />
              {t('plan.added')}
            </>
          ) : (
            <>
              {c.choose}
              <PlaneIcon size={17} aria-hidden />
            </>
          )}
        </button>

        {covered > 0 && (
          <button
            type="button"
            onClick={() => onCoverage(plan)}
            className="focus-ring -ml-1 mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-600 text-brand-700 hover:underline dark:text-accent-400"
          >
            <Globe2 size={16} aria-hidden />
            {t('global.coverageLink')}
            <ChevronRight size={16} aria-hidden />
          </button>
        )}
      </div>
    </article>
  )
}
