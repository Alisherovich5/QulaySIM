import type { LucideIcon } from 'lucide-react'
import Counter from '../ui/Counter'

export type StatTone = 'brand' | 'accent' | 'violet' | 'amber'

/**
 * Tone is now a text colour and nothing else.
 *
 * The tiles used to lead with a filled `bg-brand-50` chip — a near-white block
 * that shouted on a dark canvas and gave all four tiles the same visual
 * weight. The colour now lives in a large, very low-opacity glyph behind the
 * number, so it identifies the tile without competing with it.
 */
const TONES: Record<StatTone, string> = {
  brand: 'text-brand-500 dark:text-brand-300',
  accent: 'text-accent-600 dark:text-accent-400',
  violet: 'text-violet-signal',
  amber: 'text-amber-signal',
}

/** Gradient for the meter fill, per tone. */
const METER: Record<StatTone, string> = {
  brand: 'from-brand-500 to-accent-400',
  accent: 'from-accent-500 to-accent-400',
  violet: 'from-violet-signal to-brand-400',
  amber: 'from-amber-signal to-gold-400',
}

interface Meter {
  /** 0–1. Clamped here so a topped-up plan cannot overflow the track. */
  ratio: number
  caption: string
}

interface Props {
  icon: LucideIcon
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  tone?: StatTone
  /** Lifts one tile out of the row so the four do not all shout equally. */
  featured?: boolean
  /** Slow pulse beside the label — for counts that are live right now. */
  live?: boolean
  meter?: Meter
}

export default function StatTile({
  icon: Icon,
  value,
  label,
  prefix,
  suffix,
  decimals = 0,
  tone = 'brand',
  featured = false,
  live = false,
  meter,
}: Props) {
  const pct = meter ? Math.min(1, Math.max(0, meter.ratio)) : 0

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl p-4 ring-1 sm:p-5 ${
        featured
          ? 'elev-2 bg-gradient-to-b from-brand-500/8 to-surface ring-brand-500/25 dark:from-brand-400/10'
          : 'elev-1 bg-surface ring-line'
      }`}
    >
      {/* A coloured rule along the top edge is the only thing marking the lead
          tile. A tint alone was invisible in both themes, and a second filled
          block would put the row back where it started. */}
      {featured && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500"
        />
      )}

      {/* Watermark glyph: depth and identity without a filled block. */}
      <Icon
        aria-hidden
        size={92}
        strokeWidth={1.25}
        className={`pointer-events-none absolute -right-4 -top-5 opacity-[0.07] dark:opacity-[0.14] ${TONES[tone]}`}
      />

      {/* `items-start` and a wrapping label: at 320px the tiles are two to a
          row, which leaves about 130px, and "Jami sarflangan" clipped to
          "Jami sarflanga…". The live dot stays aligned to the first line. */}
      <p className="relative flex items-start gap-1.5 text-[11px] font-600 uppercase leading-tight tracking-[0.09em] text-slate-soft">
        {live && (
          <span aria-hidden className="relative mt-[3px] grid h-2 w-2 shrink-0 place-items-center">
            <span className="pulse-dot absolute inset-0 rounded-full bg-accent-500" />
            <span className="absolute inset-0 rounded-full bg-accent-500/50" />
          </span>
        )}
        <span className="min-w-0">{label}</span>
      </p>

      <p
        className={`relative mt-2.5 font-display font-700 leading-none tracking-[-0.02em] text-ink sm:mt-3 ${
          featured ? 'text-[1.75rem] sm:text-4xl' : 'text-2xl sm:text-3xl'
        }`}
      >
        <Counter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>

      {meter ? (
        <div className="relative mt-auto pt-3.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className={`meter-fill h-full rounded-full bg-gradient-to-r ${METER[tone]}`}
              style={{ width: `${Math.round(pct * 100)}%` }}
            />
          </div>
          <p className="mt-2 truncate text-[11px] font-500 text-slate-soft">{meter.caption}</p>
        </div>
      ) : (
        /* Keeps every tile in the row the same height as the metered one. */
        <span aria-hidden className="mt-auto" />
      )}
    </div>
  )
}
