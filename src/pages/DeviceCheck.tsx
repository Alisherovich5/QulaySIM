import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Settings,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo'
import { DialPadFigure, IdentifierSheetFigure } from '../components/device/Figures'
import { Button } from '../components/ui'

/* ==========================================================================
 * Device check — a check, not a document.
 *
 * The flow survived the redesign because it was never the problem: position
 * 01 hands over one thing to do (dial this code), position 02 asks the only
 * question that follows (which of the two rows did you see?) and answers it.
 * What was replaced is the rendering — the CSS phone cosplay with its bezel
 * gradients and barcode stripes is gone, and in its place are two line
 * drawings that state their two facts and stop. See Figures.tsx for why a
 * diagram beats an imitation screenshot.
 *
 * The verdict is still deliberately absent until the visitor has chosen:
 * nothing on the page says "eSIM works" before there is an answer to give.
 * ========================================================================== */

const DIAL_CODE = '*#06#'

/* One entrance, used only for the revealed answer. `fs-rise` ends on
   `backwards`, never `both`: a held end transform turns the panel into the
   containing block for any fixed-position descendant. */
const REVEAL = 'motion-safe:animate-[fs-rise_0.42s_ease-out_backwards]'

/**
 * The code itself, offered as a thing to copy. Typing `*` and `#` means
 * switching keyboards on most phones and a mistyped code silently does
 * nothing, so pasting is the reliable path.
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
    <div className="mt-4 rounded-2xl bg-mist p-4 ring-1 ring-line dark:bg-canvas sm:p-5">
      <p
        className="text-center font-display text-[44px] font-700 leading-none tracking-[0.14em] text-ink tabular-nums min-[360px]:text-[52px] sm:text-[60px]"
        aria-label={DIAL_CODE}
      >
        {DIAL_CODE}
      </p>
      <button
        type="button"
        onClick={copy}
        aria-label={`${DIAL_CODE} — ${t('device.copyCode')}`}
        className={`focus-ring mx-auto mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-700 ring-1 transition-colors ${
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

/** One of the two things a visitor can have seen. Neither is styled as good
 *  or bad: the fill marks the choice, not the outcome. */
function Choice({
  label,
  icon,
  selected,
  onSelect,
  controls,
}: {
  label: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
  controls: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-controls={controls}
      onClick={onSelect}
      className={`focus-ring flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 transition-colors ${
        selected
          ? 'bg-brand-600 text-white ring-brand-600 shadow-[0_14px_28px_-20px_var(--color-brand-900)]'
          : 'bg-canvas text-ink ring-line hover:bg-surface hover:ring-brand-300'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
          selected ? 'bg-white/18 text-white' : 'bg-surface text-slate-soft ring-1 ring-line'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 font-display text-[14.5px] font-700 leading-tight sm:text-[15.5px]">
        {label}
      </span>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors ${
          selected ? 'bg-white text-brand-700' : 'ring-1 ring-line'
        }`}
      >
        {selected && <Check size={12} strokeWidth={4} />}
      </span>
    </button>
  )
}

/** The refined number chip that heads each step card. */
function StepBadge({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-500/12 font-display text-xs font-700 leading-none text-brand-700 tabular-nums dark:text-brand-300">
        {n}
      </span>
      <span className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
        {label}
      </span>
    </div>
  )
}

export default function DeviceCheck() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  /* The answer has to feel like a response. On a phone it opens below the
     thumb, so it is brought into view — but only when it is actually outside
     the band left by the sticky header and the bottom nav, so a desktop
     visitor who can already see it is never yanked around. */
  const choose = useCallback((value: 'yes' | 'no') => {
    setChoice(value)
    window.requestAnimationFrame(() => {
      const el = answerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.bottom <= window.innerHeight - 80) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    })
  }, [])

  const paths = [
    { key: 'ios', label: t('device.iosLabel'), path: t('device.iosPath') },
    { key: 'android', label: t('device.androidLabel'), path: t('device.androidPath') },
  ]

  return (
    <div className="container-page pb-6 pt-2 sm:py-10">
      <Seo title={t('seo.deviceTitle')} description={t('seo.deviceDescription')} />

      <Link
        to="/"
        className="focus-ring -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-600 text-slate-soft transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ArrowLeft size={15} /> {t('device.back')}
      </Link>

      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 text-[11px] font-700 uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
          <Smartphone size={13} aria-hidden /> {t('device.stepsTitle')}
        </span>
        <h1 className="mt-3 font-display text-[26px] font-700 leading-[1.1] tracking-[-0.02em] text-ink min-[360px]:text-[30px] sm:text-[42px] lg:text-[48px]">
          {t('device.title')}
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-slate-soft sm:mt-4 sm:text-[17px] sm:leading-[1.6]">
          {t('device.intro')}
        </p>
      </header>

      {/* The instrument. Two positions, side by side once there is width. */}
      <div className="mt-5 grid items-start gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-2 lg:gap-5">
        {/* ── 01 · what you type ─────────────────────────────────────────── */}
        <section className="card elev-1 p-4 sm:p-6">
          <StepBadge n="01" label={t('device.mockDialLabel')} />

          <h2 className="mt-3 font-display text-[16px] font-700 leading-snug text-ink sm:text-lg">
            {t('device.steps.dial.title')}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
            {t('device.steps.dial.text')}
          </p>

          <CodePlate />

          <div className="mt-5">
            <DialPadFigure />
            <p className="mx-auto mt-3 max-w-[38ch] text-center text-[11.5px] leading-[1.5] text-slate-soft sm:text-xs">
              {t('device.dialHint')}
            </p>
          </div>
        </section>

        {/* ── 02 · what you see ──────────────────────────────────────────── */}
        <section className="card elev-1 p-4 sm:p-6">
          <StepBadge n="02" label={t('device.mockResultLabel')} />

          <h2 className="mt-3 font-display text-[16px] font-700 leading-snug text-ink sm:text-lg">
            {t('device.steps.read.title')}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
            {t('device.steps.read.text')}
          </p>

          <div className="mt-4">
            <IdentifierSheetFigure />
            <p className="mt-2 text-[11.5px] leading-[1.5] text-slate-soft sm:text-xs">
              {t('device.mockSheetNote')}
            </p>
          </div>

          <div className="mt-4 grid gap-2.5 min-[400px]:grid-cols-2">
            <Choice
              controls="dc-answer"
              selected={choice === 'yes'}
              onSelect={() => choose('yes')}
              label={t('device.yesTitle')}
              icon={<Check size={16} strokeWidth={2.8} />}
            />
            <Choice
              controls="dc-answer"
              selected={choice === 'no'}
              onSelect={() => choose('no')}
              label={t('device.noTitle')}
              icon={<X size={16} strokeWidth={2.8} />}
            />
          </div>

          {/* The answer. Empty until a choice is made — this is the one thing
              the page must not say in advance. */}
          <div id="dc-answer" ref={answerRef} aria-live="polite">
            {choice && (
              <div key={choice} className={`mt-3 ${REVEAL}`}>
                {choice === 'yes' ? (
                  <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-brand-600 to-brand-800 p-4 sm:p-5">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent-400/25 blur-2xl"
                    />
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-700 leading-none text-white ring-1 ring-white/25">
                        <Check size={12} strokeWidth={3.5} /> {t('device.eidFound')}
                      </span>
                      <h3 className="mt-2.5 font-display text-[20px] font-700 leading-tight text-white sm:text-[23px]">
                        {t('device.yesTitle')}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-white/85 sm:text-sm sm:leading-6">
                        {t('device.yesText')}
                      </p>
                      <Link
                        to="/destinations"
                        className="focus-ring-invert mt-3.5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13.5px] font-700 text-brand-700 transition-colors hover:bg-brand-50"
                      >
                        {t('device.yesCta')} <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[22px] bg-surface-2 p-4 ring-1 ring-line sm:p-5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-canvas text-slate-soft ring-1 ring-line">
                      <X size={17} strokeWidth={2.6} />
                    </span>
                    <h3 className="mt-2.5 font-display text-[20px] font-700 leading-tight text-ink sm:text-[23px]">
                      {t('device.noTitle')}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
                      {t('device.noText')}
                    </p>
                    <Button to="/support" variant="ghost" className="mt-3.5 min-h-11 px-4 py-2.5 text-[13.5px]">
                      {t('device.noCta')}
                    </Button>
                  </div>
                )}

                {/* The rule that produced the answer, stated after it rather
                    than before it. */}
                <div className="mt-2.5 rounded-2xl bg-canvas px-3.5 py-3 ring-1 ring-line">
                  <p className="font-display text-[12.5px] font-700 leading-snug text-ink">
                    {t('device.steps.decide.title')}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-soft sm:text-[12.5px]">
                    {t('device.steps.decide.text')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* The other way in, for a code that does nothing. Findable, and quiet. */}
      <section className="mt-7 border-t border-line pt-5 sm:mt-10 sm:pt-6">
        <div className="flex items-start gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface text-slate-soft ring-1 ring-line">
            <Settings size={14} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[14px] font-700 leading-snug text-ink sm:text-base">
              {t('device.settingsTitle')}
            </h2>
            <p className="mt-1 text-[12px] leading-[1.5] text-slate-soft sm:text-[13.5px]">
              {t('device.settingsIntro')}
            </p>
          </div>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3">
          {paths.map((item) => (
            <li key={item.key} className="min-w-0 rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-line">
              <p className="text-[11px] font-700 leading-none text-brand-700 dark:text-brand-300">
                {item.label}
              </p>
              <p className="mt-1.5 break-words text-[12px] leading-[1.5] text-slate-soft sm:text-[13px]">
                {item.path}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-[1.55] text-slate-soft sm:mt-6 sm:text-[12.5px]">
        <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-brand-500 dark:text-brand-300" />
        {t('device.privacyNote')}
      </p>
    </div>
  )
}
