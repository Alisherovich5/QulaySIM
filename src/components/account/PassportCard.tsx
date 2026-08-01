import { Stamp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PassportCountry } from '../../lib/types'
import Flag from '../Flag'

interface Props {
  passport: PassportCountry[]
}

/**
 * The travel passport.
 *
 * The stamps used to be 2px dashed boxes, each rotated a few degrees on a
 * dotted background. At two columns the rotation made a tidy grid look
 * misaligned rather than hand-placed, and a bright mint dashed border is the
 * loudest thing on the card in the dark theme.
 *
 * The metaphor is kept, quieter: a real surface with real elevation, and the
 * dashed line moved inside as a hairline inset ring — the stamp cue without
 * the scrapbook. The tilt now only happens on hover, so it is felt on the one
 * card you are pointing at instead of seen across all of them at rest.
 */
export default function PassportCard({ passport }: Props) {
  const { t } = useTranslation()

  return (
    <section className="card elev-1 overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/15 dark:text-brand-300"
          >
            <Stamp size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-700 leading-tight tracking-[-0.01em] sm:text-lg">
              {t('account.passportTitle')}
            </h2>
            <p className="truncate text-xs text-slate-soft">{t('account.passportSubtitle')}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 font-display text-sm font-700 tabular-nums text-ink ring-1 ring-line">
          {passport.length}
        </span>
      </header>

      {passport.length === 0 ? (
        <p className="px-6 pb-10 pt-4 text-center text-sm text-slate-soft">
          {t('account.passportEmpty')}
        </p>
      ) : (
        <div
          className="grid grid-cols-2 gap-3 border-t border-line px-4 py-5 sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-6 lg:grid-cols-4"
          style={{
            /* Faint paper texture, pulled well back from the original — it is
               a hint of a passport page, not a pattern to read. */
            backgroundImage: 'radial-gradient(var(--color-line) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '-1px -1px',
          }}
        >
          {passport.map((c) => (
            <div
              key={c.iso2}
              className="elev-1 group relative flex flex-col items-center gap-2.5 rounded-2xl bg-surface p-3.5 text-center ring-1 ring-line transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:rotate-[-1.2deg] hover:shadow-[var(--fs-e2)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0 sm:p-4"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-brand-500/25 dark:border-brand-300/20"
              />
              <Flag
                iso2={c.iso2}
                w={80}
                className="h-8 w-12 rounded-md object-cover shadow-sm ring-1 ring-ink/10"
              />
              <p className="line-clamp-2 min-h-[2.1rem] text-[0.8125rem] font-600 leading-snug text-ink">
                {c.name}
              </p>
              <p className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-700 uppercase tracking-[0.06em] text-brand-600 dark:text-brand-300">
                {t('account.stamps', { count: c.esims })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
