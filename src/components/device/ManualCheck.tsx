import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Copy, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DialPadFigure, IdentifierSheetFigure } from './Figures'
import { Mark } from './shared'
import { REVEAL } from './verdictRules'
import { Button } from '../ui'

/**
 * The method that is certain, kept one tap away.
 *
 * The search above answers for a model that is on the list. This answers for
 * any device at all — and for the models sold in both eSIM and non-eSIM forms,
 * where the list can only say "probably". It is closed by default because for
 * most visitors the search has already answered; it is not removed, because for
 * the rest it is the only thing that can.
 */

const DIAL_CODE = '*#06#'

/**
 * The code, offered as a thing to copy. Typing `*` and `#` means switching
 * keyboards on most phones and a mistyped code silently does nothing.
 */
function CodePlate() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(DIAL_CODE)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied (insecure origin, or the user said no). The code is
      // printed right here, so there is nothing to recover from.
    }
  }, [])

  return (
    <div className="mt-3 rounded-2xl bg-mist p-4 ring-1 ring-line dark:bg-canvas">
      <p
        className="text-center font-display text-[40px] font-700 leading-none tracking-[0.14em] text-ink tabular-nums min-[360px]:text-[48px]"
        aria-label={DIAL_CODE}
      >
        {DIAL_CODE}
      </p>
      <button
        type="button"
        onClick={copy}
        aria-label={`${DIAL_CODE} — ${t('device.copyCode')}`}
        className={`focus-ring mx-auto mt-3.5 flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-700 ring-1 transition-colors ${
          copied
            ? 'bg-accent-500/10 text-status-good-ink ring-accent-500/40'
            : 'bg-surface text-ink ring-line hover:text-brand-600 hover:ring-brand-300 dark:hover:text-brand-300'
        }`}
      >
        {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
        {copied ? t('device.copied') : t('device.copyCode')}
      </button>
    </div>
  )
}

/** One of the two things a visitor can have seen in the *#06# sheet. */
function Choice({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-controls="dc-answer"
      onClick={onSelect}
      className={`focus-ring flex min-h-[54px] w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 transition-colors ${
        selected
          ? 'bg-brand-600 text-white ring-brand-600 shadow-[0_14px_28px_-20px_var(--color-brand-900)]'
          : 'bg-canvas text-ink ring-line hover:bg-surface hover:ring-brand-300'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
          selected ? 'bg-white/18 text-white' : 'bg-surface text-slate-soft ring-1 ring-line'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 font-display text-[14.5px] font-700 leading-tight">
        {label}
      </span>
    </button>
  )
}


export default function ManualCheck({
  open,
  onToggle,
  ref,
}: {
  open: boolean
  onToggle: () => void
  ref: React.Ref<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null)

  return (
      <div ref={ref} className="mt-6 scroll-mt-28 sm:mt-9">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="dc-manual"
          onClick={onToggle}
          className="focus-ring flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-line transition-colors hover:ring-brand-300"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14.5px] font-700 leading-tight text-ink sm:text-base">
              {t('device.manualTitle')}
            </span>
            <span className="mt-0.5 block text-[12px] leading-[1.45] text-slate-soft">
              {t('device.manualLead')}
            </span>
          </span>
          <ChevronDown
            size={18}
            aria-hidden
            className={`shrink-0 text-slate-soft transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div id="dc-manual" className={`mt-3 grid items-start gap-3 lg:grid-cols-2 lg:gap-4 ${REVEAL}`}>
            <section className="card elev-1 p-4 sm:p-5">
              <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                {t('device.mockDialLabel')}
              </p>
              <h3 className="mt-2 font-display text-[15.5px] font-700 leading-snug text-ink sm:text-[17px]">
                {t('device.steps.dial.title')}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-[13.5px]">
                {t('device.steps.dial.text')}
              </p>
              <CodePlate />
              <div className="mt-4">
                <DialPadFigure />
                <p className="mx-auto mt-3 max-w-[38ch] text-center text-[11.5px] leading-[1.5] text-slate-soft">
                  {t('device.dialHint')}
                </p>
              </div>
            </section>

            <section className="card elev-1 p-4 sm:p-5">
              <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                {t('device.mockResultLabel')}
              </p>
              <h3 className="mt-2 font-display text-[15.5px] font-700 leading-snug text-ink sm:text-[17px]">
                {t('device.steps.read.title')}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-[13.5px]">
                {t('device.steps.read.text')}
              </p>

              <div className="mt-3.5">
                <IdentifierSheetFigure />
                <p className="mt-2 text-[11.5px] leading-[1.5] text-slate-soft">
                  {t('device.mockSheetNote')}
                </p>
              </div>

              <div className="mt-4 grid gap-2.5 min-[400px]:grid-cols-2">
                <Choice
                  selected={choice === 'yes'}
                  onSelect={() => setChoice('yes')}
                  label={t('device.yesTitle')}
                  icon={<Check size={16} strokeWidth={2.8} />}
                />
                <Choice
                  selected={choice === 'no'}
                  onSelect={() => setChoice('no')}
                  label={t('device.noTitle')}
                  icon={<X size={16} strokeWidth={2.8} />}
                />
              </div>

              {/* Empty until a choice is made — the one thing this page must
                  not say in advance. */}
              <div id="dc-answer" aria-live="polite">
                {choice && (
                  <div key={choice} className={`mt-3 rounded-2xl bg-canvas p-3.5 ring-1 ring-line ${REVEAL}`}>
                    <div className="flex items-start gap-2.5">
                      <Mark verdict={choice === 'yes' ? 'yes' : 'no'} />
                      <div className="min-w-0">
                        <p className="font-display text-[14px] font-700 leading-snug text-ink">
                          {choice === 'yes' ? t('device.yesTitle') : t('device.noTitle')}
                        </p>
                        <p className="mt-1 text-[12px] leading-[1.5] text-slate-soft">
                          {choice === 'yes' ? t('device.yesText') : t('device.noText')}
                        </p>
                        {choice === 'yes' ? (
                          <Link
                            to="/destinations"
                            className="focus-ring mt-2.5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-[13px] font-700 text-white hover:bg-brand-700"
                          >
                            {t('device.yesCta')} <ArrowRight size={15} />
                          </Link>
                        ) : (
                          <Button to="/support" variant="ghost" className="mt-2.5 min-h-10 px-3.5 text-[13px]">
                            {t('device.noCta')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[12px] font-700 leading-snug text-ink">{t('device.settingsTitle')}</p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-soft">
                  <span className="font-600 text-brand-700 dark:text-brand-300">{t('device.iosLabel')}</span>{' '}
                  {t('device.iosPath')}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-soft">
                  <span className="font-600 text-brand-700 dark:text-brand-300">{t('device.androidLabel')}</span>{' '}
                  {t('device.androidPath')}
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
  )
}
