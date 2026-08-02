import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Copy, Settings, ShieldCheck, Wifi, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Seo from '../components/Seo'

/* ==========================================================================
 * Device check — Direction A: a check, not a document.
 *
 * The page is an instrument with two positions. Position 01 hands over one
 * thing to do (dial this code). Position 02 asks the only question that
 * follows (which of the two things did you see?) and answers it.
 *
 * The verdict is deliberately absent until the visitor has chosen. Nothing on
 * the page says "eSIM works" before there is an answer to give — `eidFound`
 * lives inside the revealed result, not under the code.
 * ========================================================================== */

const DIAL_CODE = '*#06#'

/* The dialled code is drawn as it appears on a phone screen: thin, wide, and
   in the platform UI font. Inter only ships at 400+ here, so a genuinely light
   numeral needs the system stack. A font choice, not a colour one. */
const IOS_FONT =
  'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
const SCREEN_FONT: CSSProperties = { fontFamily: IOS_FONT }

/* The two dark objects on the page — the code plate and the answer — are the
   only saturated surfaces, and both are built from the brand ramp rather than
   raw hexes so they hold in either theme. brand-700/-900 and brand-600/-800
   both clear 5.7:1 against white text. */
const SCREEN_BG: CSSProperties = {
  backgroundImage:
    'radial-gradient(120% 90% at 50% -25%, var(--color-brand-700) 0%, var(--color-brand-900) 62%)',
}
const BEZEL_BG: CSSProperties = {
  backgroundImage:
    'linear-gradient(150deg, var(--color-brand-300) 0%, var(--color-brand-800) 16%, var(--color-brand-900) 50%, var(--color-brand-800) 84%, var(--color-brand-400) 100%)',
}
const ANSWER_BG: CSSProperties = {
  backgroundImage:
    'linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-800) 100%)',
}

/* One entrance, used only for the revealed answer. `fs-rise` is defined in
   index.css and ends on `backwards`, never `both`: a held end transform turns
   the panel into the containing block for any fixed-position descendant. The
   `motion-safe:` prefix removes the animation outright under
   prefers-reduced-motion rather than slowing it. */
const REVEAL = 'motion-safe:animate-[fs-rise_0.42s_ease-out_backwards]'

/* -------------------------------------------------------------------------- *
 * Phone-screen drawing
 *
 * Adapted from the mock-ups on the current page. Two fragments survive: the
 * status strip and the identifiers sheet. The full 393x852 device drawing cost
 * ~700px of a 320px screen to illustrate a code that this page now prints at
 * 52px, so the drawing is cropped to the parts that carry information — the
 * screen the code is typed on, and the sheet it opens.
 *
 * The numbers are invented and the bars are a picture, not a scannable code:
 * a real screenshot would carry the owner's own device identifiers.
 * `privacyNote` and `mockSheetNote` both say so and both have to stay true.
 * -------------------------------------------------------------------------- */

/** Time, island, signal, battery — the cue that says "this is a phone". */
function StatusStrip() {
  return (
    <span aria-hidden className="relative flex items-center justify-between px-4 pt-2">
      <span className="text-[10px] font-600 leading-none text-white/75 tabular-nums">9:41</span>
      <span className="absolute left-1/2 top-[5px] h-[13px] w-[42px] -translate-x-1/2 rounded-full bg-brand-900 ring-1 ring-white/10" />
      <span className="flex items-center gap-[5px]">
        <span className="flex items-end gap-[1.5px]">
          {[3, 5, 7, 9].map((h) => (
            <span
              key={h}
              className="w-[2px] rounded-[1px] bg-white/75"
              style={{ height: `${h}px` }}
            />
          ))}
        </span>
        <Wifi size={11} strokeWidth={3} className="text-white/75" />
        <span className="relative flex h-[8px] w-[15px] items-center rounded-[3px] p-[1.5px] ring-1 ring-white/45">
          <span className="h-full w-[68%] rounded-[1px] bg-white/80" />
        </span>
      </span>
    </span>
  )
}

/** Bars only. Widths come from the sample digits, so the two codes differ from
 *  each other and never change between renders. */
function barPattern(seed: string) {
  return [...seed].flatMap((c, i) => {
    const d = Number(c)
    return [
      { on: true, w: (d % 3) + 1 },
      { on: false, w: ((d + i) % 3) + 1 },
    ]
  })
}
const BARS_EID = barPattern('890490320074123409172658043197')
const BARS_IMEI = barPattern('351421087468972104358160274935')

function IdRow({
  label,
  bars,
  lit,
}: {
  label: ReactNode
  bars: ReturnType<typeof barPattern>
  /** the EID row is the one being hunted for, so it is the one that is lit */
  lit?: boolean
}) {
  return (
    <div
      className={`min-w-0 rounded-xl px-2.5 py-2 ring-1 ${
        lit ? 'bg-white/12 ring-accent-400/55' : 'bg-white/5 ring-white/10'
      }`}
    >
      <p className="truncate text-[10px] font-600 leading-none tracking-[0.04em] text-white/70 tabular-nums">
        {label}
      </p>
      <div className="mt-1.5 flex h-[18px] items-stretch overflow-hidden rounded-[3px] bg-white px-1 py-[3px]">
        {bars.map((b, i) => (
          <span key={i} className={b.on ? 'bg-brand-900' : ''} style={{ flex: b.w }} />
        ))}
      </div>
    </div>
  )
}

/**
 * The sheet the code opens, drawn at the size it needs to be recognised and no
 * larger. It sits in step 02 because it is the thing the question is about:
 * you are being asked which of these two rows your own screen shows.
 */
function IdentifiersSheet() {
  const { t } = useTranslation()
  return (
    <div
      aria-hidden
      className="relative mt-3 overflow-hidden rounded-[20px] p-[2px] shadow-[0_18px_36px_-26px_var(--color-brand-900)]"
      style={{ ...BEZEL_BG, ...SCREEN_FONT }}
    >
      <div className="rounded-[18px] pb-3" style={SCREEN_BG}>
        <StatusStrip />

        <div className="mt-2.5 flex items-center gap-2 px-3">
          <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-white/12">
            <X size={12} strokeWidth={3} className="text-white/70" />
          </span>
          <p className="min-w-0 truncate text-[12.5px] font-700 leading-none text-white">
            {t('device.resultTitle')}
          </p>
        </div>

        <div className="mt-2.5 grid gap-2 px-3 min-[420px]:grid-cols-2">
          <IdRow lit label={<>EID 8904&thinsp;9032&thinsp;0074&thinsp;…&thinsp;1234</>} bars={BARS_EID} />
          <IdRow label={<>IMEI 3514&thinsp;2108&thinsp;…&thinsp;6897</>} bars={BARS_IMEI} />
        </div>

        <p className="mt-2 px-3 text-[10px] leading-[1.45] text-white/60">
          {t('device.mockSheetNote')}
        </p>

        <span className="mx-3 mt-2.5 flex h-[26px] items-center justify-center rounded-full bg-white/12 text-[11px] font-700 text-white ring-1 ring-white/20">
          {t('device.mockDone')}
        </span>
      </div>
    </div>
  )
}

/* ---------------------------- end of the drawing --------------------------- */

/**
 * Step 01. The code is the hero: the whole plate is one control, so the tap
 * target is the object itself rather than a button beside it. Typing `*` and
 * `#` means switching keyboards on most phones and a mistyped code silently
 * does nothing, so the code is offered as something to paste.
 */
function DialPlate() {
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
      // printed on the control itself, so there is nothing to recover from.
    }
  }, [])

  return (
    <div className="relative mt-3">
      {/* Bounce light, so the plate sits on the card instead of in front of it.
          `.blur-2xl` carries the global translateZ(0) that stops WebKit
          compositing a transparent hole where it paints. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 bottom-0 top-12 rounded-[44px] bg-brand-500/25 blur-2xl dark:bg-brand-400/20"
      />

      <button
        type="button"
        onClick={copy}
        aria-label={`${DIAL_CODE} — ${t('device.copyCode')}`}
        className="focus-ring sheen group relative block w-full rounded-[28px] p-[3px] shadow-[0_26px_50px_-30px_var(--color-brand-900)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5"
        style={BEZEL_BG}
      >
        <span
          className="block rounded-[25px] ring-1 ring-inset ring-white/10"
          style={{ ...SCREEN_BG, ...SCREEN_FONT }}
        >
          <StatusStrip />

          <span className="block px-3 pb-0 pt-2 text-center">
            <span className="block text-[48px] leading-none tracking-[0.1em] text-white [font-weight:300] min-[360px]:text-[58px] sm:text-[68px] lg:text-[86px]">
              {DIAL_CODE}
            </span>
          </span>

          <span className="mt-2.5 flex justify-center pb-2.5 lg:mt-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-700 leading-none ring-1 transition-colors ${
                copied
                  ? 'bg-accent-400/20 text-accent-400 ring-accent-400/45'
                  : 'bg-white/10 text-white/85 ring-white/20 group-hover:bg-white/16 group-hover:text-white'
              }`}
            >
              {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
              {copied ? t('device.copied') : t('device.copyCode')}
            </span>
          </span>

          <span aria-hidden className="mx-auto mb-2 block h-[3px] w-20 rounded-full bg-white/25" />
        </span>
      </button>
    </div>
  )
}

/** One of the two things a visitor can have seen. Neither is styled as good or
 *  bad: the fill marks the choice, not the outcome. */
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

export default function DeviceCheckA() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  /* The answer has to feel like a response. On a phone it opens below the
     thumb, so it is brought into view — but only when it is actually out of
     the band left by the 102px header and the 69px bottom nav, so a desktop
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
    <div className="container-page pb-4 pt-2 sm:py-10">
      <Seo title={t('seo.deviceTitle')} description={t('seo.deviceDescription')} />
      <Link
        to="/"
        className="focus-ring -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-600 text-slate-soft transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ArrowLeft size={15} /> {t('device.back')}
      </Link>

      <header>
        <h1 className="max-w-[19ch] font-display text-[24px] font-700 leading-[1.1] tracking-[-0.02em] text-ink min-[360px]:text-[29px] sm:text-[42px] lg:text-[50px]">
          {t('device.title')}
        </h1>
        <p className="mt-1.5 max-w-[54ch] text-[12.5px] leading-[1.45] text-slate-soft sm:mt-4 sm:text-[17px] sm:leading-[1.6]">
          {t('device.intro')}
        </p>
      </header>

      {/* The instrument. Two positions, side by side once there is width for
          them; stacked in source order on a phone. At `lg` the quiet material
          is placed into the left column so the answer column can run long
          without leaving a hole beside it. */}
      <div className="mt-3.5 flex items-center gap-3 sm:mt-9">
        <h2 className="shrink-0 text-[10.5px] font-700 uppercase tracking-[0.18em] text-slate-soft sm:text-[11.5px]">
          {t('device.stepsTitle')}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-2.5 grid items-start gap-2.5 sm:mt-4 sm:gap-4 lg:grid-cols-[1fr_1.06fr] lg:grid-rows-[auto_auto_auto_1fr] lg:gap-x-5 lg:gap-y-4">
        {/* ── 01 · what you type ─────────────────────────────────────────── */}
        <section className="rounded-[26px] bg-surface p-3.5 ring-1 ring-line elev-1 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-brand-500/12 font-display text-[11.5px] font-700 leading-none text-brand-700 tabular-nums dark:text-brand-300">
              01
            </span>
            <span className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
              {t('device.mockDialLabel')}
            </span>
          </div>

          <DialPlate />

          <h3 className="mt-4 font-display text-[15px] font-700 leading-snug text-ink sm:text-[17px]">
            {t('device.steps.dial.title')}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
            {t('device.steps.dial.text')}
          </p>
        </section>

        {/* ── 02 · what you see ──────────────────────────────────────────── */}
        <section className="rounded-[26px] bg-surface p-3.5 ring-1 ring-line elev-1 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-brand-500/12 font-display text-[11.5px] font-700 leading-none text-brand-700 tabular-nums dark:text-brand-300">
              02
            </span>
            <span className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
              {t('device.mockResultLabel')}
            </span>
          </div>

          <h3 className="mt-2.5 font-display text-[15px] font-700 leading-snug text-ink sm:text-[17px]">
            {t('device.steps.read.title')}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
            {t('device.steps.read.text')}
          </p>

          <IdentifiersSheet />

          <div className="mt-3.5 grid gap-2.5 min-[400px]:grid-cols-2">
            <Choice
              controls="dca-answer"
              selected={choice === 'yes'}
              onSelect={() => choose('yes')}
              label={t('device.yesTitle')}
              icon={<Check size={16} strokeWidth={2.8} />}
            />
            <Choice
              controls="dca-answer"
              selected={choice === 'no'}
              onSelect={() => choose('no')}
              label={t('device.noTitle')}
              icon={<X size={16} strokeWidth={2.8} />}
            />
          </div>

          {/* The answer. Empty until a choice is made — this is the one thing
              the page must not say in advance. */}
          <div id="dca-answer" ref={answerRef} aria-live="polite">
            {choice && (
              <div key={choice} className={`mt-3 ${REVEAL}`}>
                {choice === 'yes' ? (
                  <div
                    className="relative overflow-hidden rounded-[22px] p-4 sm:p-5"
                    style={ANSWER_BG}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent-400/25 blur-2xl"
                    />
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-700 leading-none text-white ring-1 ring-white/25">
                        <Check size={12} strokeWidth={3.5} /> {t('device.eidFound')}
                      </span>
                      <h4 className="mt-2.5 font-display text-[20px] font-700 leading-tight text-white sm:text-[23px]">
                        {t('device.yesTitle')}
                      </h4>
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
                    <h4 className="mt-2.5 font-display text-[20px] font-700 leading-tight text-ink sm:text-[23px]">
                      {t('device.noTitle')}
                    </h4>
                    <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
                      {t('device.noText')}
                    </p>
                    <Link
                      to="/support"
                      className="focus-ring btn-ghost mt-3.5 min-h-11 px-4 py-2.5 text-[13.5px]"
                    >
                      {t('device.noCta')}
                    </Link>
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

      {/* The other way in, for a code that does nothing. Findable, and quiet:
          a hairline and two paths, no card competing with the instrument. */}
      <section className="mt-6 border-t border-line pt-4 sm:mt-10 sm:pt-6">
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
        <ul className="mt-2.5 grid gap-2 sm:mt-3 sm:grid-cols-2 sm:gap-3">
          {paths.map((item) => (
            <li
              key={item.key}
              className="min-w-0 rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-line"
            >
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
        <ShieldCheck
          size={14}
          aria-hidden
          className="mt-px shrink-0 text-brand-500 dark:text-brand-300"
        />
        {t('device.privacyNote')}
      </p>
    </div>
  )
}
