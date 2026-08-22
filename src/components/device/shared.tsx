import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Sparkles, X } from 'lucide-react'

import type { EsimDevice } from '../../data/esimDevices'
import { type Verdict, verdictOf } from './verdictRules'

/* The pieces the three parts of the device check share: the verdict itself, the
   one mark that shows it, and the row that renders a model. Split out of a
   748-line page so each part can be given props and tested through them. */

/* One entrance, used only for revealed answers. `fs-rise` ends on `backwards`,
   never `both`: a held end transform turns the panel into the containing block
   for any fixed-position descendant. */
export function Mark({ verdict, size = 'sm' }: { verdict: Verdict; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-9 w-9' : 'h-6 w-6'
  const icon = size === 'lg' ? 17 : 12
  const tone =
    verdict === 'no'
      ? 'bg-surface text-slate-soft ring-1 ring-line'
      : verdict === 'regional'
        ? 'bg-status-warn-bg text-status-warn-ink ring-1 ring-status-warn-ink/25'
        : 'bg-accent-500/15 text-status-good-ink ring-1 ring-accent-500/35'
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full ${box} ${tone}`}>
      {verdict === 'no' ? (
        <X size={icon} strokeWidth={3} />
      ) : verdict === 'regional' ? (
        <Sparkles size={icon} strokeWidth={2.6} />
      ) : (
        <Check size={icon} strokeWidth={3.4} />
      )}
    </span>
  )
}

/** A row in the suggestion list and in a brand's model list — the same row in
 *  both places, so a model looks the same however it was reached. */
export function DeviceRow({
  device,
  active,
  onPick,
  id,
}: {
  device: EsimDevice
  active?: boolean
  onPick: () => void
  id?: string
}) {
  const { t } = useTranslation()
  const verdict = verdictOf(device)
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={!!active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-brand-500/10' : 'hover:bg-mist dark:hover:bg-canvas'
      }`}
    >
      <Mark verdict={verdict} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-600 leading-tight text-ink">
          {device.model}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-slate-soft">
          {device.brand}
          {device.codes?.length ? ` · ${device.codes.join(', ')}` : ''}
        </span>
      </span>
      <span
        className={`shrink-0 text-[11px] font-700 leading-none ${
          verdict === 'no' ? 'text-slate-soft' : verdict === 'regional' ? 'text-status-warn-ink' : 'text-status-good-ink'
        }`}
      >
        {t(`device.badge.${verdict}`)}
      </span>
    </button>
  )
}



/**
 * "Check on the phone" — the same button, four times over.
 *
 * It appears under every kind of answer, because every kind of answer can be
 * confirmed: a plain yes, a "depends on the market", a no, and a model number
 * the list has never heard of. Written out by hand it was four copies of the
 * same markup with three different className strings, which is three chances to
 * make them drift.
 *
 * `tone` is the only real difference: `quiet` sits on a card, `loud` is the
 * primary action on one, and `invert` sits on the brand gradient.
 */
export function CheckExactlyButton({
  onClick,
  tone = 'quiet',
  className = '',
}: {
  onClick: () => void
  tone?: 'quiet' | 'loud' | 'invert'
  className?: string
}) {
  const { t } = useTranslation()
  const base = 'inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-[13.5px] font-700'
  const tones = {
    quiet: 'focus-ring bg-canvas text-ink ring-1 ring-line hover:ring-brand-300',
    loud: 'focus-ring bg-brand-600 text-white hover:bg-brand-700',
    invert: 'focus-ring-invert bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25',
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${tones[tone]} ${className}`}>
      {t('device.checkExactly')}
      {tone === 'loud' && <ArrowRight size={16} />}
    </button>
  )
}
