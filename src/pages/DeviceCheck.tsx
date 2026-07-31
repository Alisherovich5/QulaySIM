import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Phone,
  Settings,
  Smartphone,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, IconBadge } from '../components/ui'

const DIAL_CODE = '*#06#'

/**
 * Illustration of the dialler code, drawn rather than screenshotted.
 *
 * A real screenshot of this screen carries the owner's actual EID and IMEI,
 * which are device identifiers — so the numbers below are deliberately
 * invented, and the barcodes are decorative bars rather than scannable codes.
 */
function DiallerMock() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-[2rem] bg-[#111] p-4 shadow-xl ring-1 ring-black/20">
      <p className="py-4 text-center font-display text-2xl font-600 tracking-wider text-white">
        {DIAL_CODE}
      </p>
      {/* The keypad and the call button are the drawing, not information: a
          screen reader announcing "1 2 3 4 5 6 7 8 9 star 0 hash" adds nothing
          the heading above has not already said. */}
      <div aria-hidden className="grid grid-cols-3 gap-2.5">
        {keys.map((k) => (
          <span
            key={k}
            className={`grid h-12 place-items-center rounded-full text-lg font-500 ${
              k === '*' || k === '#' || k === '0'
                ? 'bg-brand-500/25 text-white ring-1 ring-brand-400/50'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {k}
          </span>
        ))}
      </div>
      <span
        aria-hidden
        /* Not a brand token on purpose: this imitates the phone's own dialler,
           and the call button is green on both iOS and Android. Painting it in
           our brand colour would stop it reading as the thing being copied. */
        className="mx-auto mt-3 grid h-11 w-11 place-items-center rounded-full bg-[#31c554] text-white"
      >
        <Phone size={18} className="fill-white" />
      </span>
    </div>
  )
}

/**
 * Typing `*` and `#` means switching keyboards on most phones, and a mistyped
 * code silently does nothing — so the code is offered as something to paste
 * into the dialler rather than something to transcribe.
 */
function CopyCode() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DIAL_CODE)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied (insecure origin, or the user said no). The code is
      // printed right above, so there is nothing to recover from.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-600 text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {copied ? <Check size={15} className="text-brand-600" /> : <Copy size={15} />}
      {copied ? t('device.copied') : t('device.copyCode')}
    </button>
  )
}

/** Bars only — this is a picture of a barcode, not a working one. */
function FakeBarcode() {
  const widths = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3, 1]
  return (
    <span aria-hidden className="flex h-9 items-stretch gap-[2px] rounded bg-white px-2 py-1.5">
      {widths.map((w, i) => (
        <span key={i} className="bg-black" style={{ width: `${w}px` }} />
      ))}
    </span>
  )
}

function ResultMock() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[2rem] bg-[#111] p-4 shadow-xl ring-1 ring-black/20">
      <p className="text-sm font-600 text-white">{t('device.resultTitle')}</p>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-brand-500/15 p-2.5 ring-1 ring-brand-400/50">
          <p className="text-[11px] font-600 text-brand-200">
            EID 8904&thinsp;9032&thinsp;0074&thinsp;…&thinsp;1234
          </p>
          <div className="mt-1.5">
            <FakeBarcode />
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-600 text-brand-200">
            <Check size={11} /> {t('device.eidFound')}
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.06] p-2.5">
          <p className="text-[11px] text-white/55">IMEI 3514&thinsp;2108&thinsp;…&thinsp;6897</p>
          <div className="mt-1.5 opacity-45">
            <FakeBarcode />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DeviceCheck() {
  const { t } = useTranslation()

  const steps = [
    { icon: <Phone size={18} />, key: 'dial' },
    { icon: <Smartphone size={18} />, key: 'read' },
    { icon: <Check size={18} />, key: 'decide' },
  ]

  const settingsPaths = [
    { key: 'ios', path: t('device.iosPath') },
    { key: 'android', path: t('device.androidPath') },
  ]

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Pulled out of the text flow with -ml/-mt so the 44px thumb target does
          not push the heading down on a phone. */}
      <Link
        to="/"
        className="-ml-2 -mt-2 inline-flex min-h-11 items-center gap-1.5 px-2 py-2 text-sm font-600 text-slate-soft transition hover:text-brand-600"
      >
        <ArrowLeft size={15} /> {t('device.back')}
      </Link>

      <header className="mt-6 max-w-2xl">
        <IconBadge icon={Smartphone} size="lg" />
        <h1 className="mt-4 font-display text-2xl font-700 text-ink sm:text-3xl">
          {t('device.title')}
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-slate-soft sm:text-base">
          {t('device.intro')}
        </p>
      </header>

      {/* The two mocks sit side by side because the answer is the comparison:
          you dial on the left and look for an EID on the right. */}
      <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-700 text-ink">{t('device.stepsTitle')}</h2>
          <ol className="mt-5 space-y-5">
            {steps.map((step, i) => (
              <li key={step.key} className="flex gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-surface-2 dark:text-brand-300">
                  {step.icon}
                </span>
                <span className="min-w-0">
                  <p className="text-sm font-700 text-ink">
                    <span className="text-slate-soft">{i + 1}.</span>{' '}
                    {t(`device.steps.${step.key}.title`)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-soft">
                    {t(`device.steps.${step.key}.text`)}
                  </p>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl bg-mist p-4">
            <p className="text-sm font-700 text-ink">{t('device.settingsTitle')}</p>
            <p className="mt-1 text-sm text-slate-soft">{t('device.settingsIntro')}</p>
            <ul className="mt-3 space-y-2">
              {settingsPaths.map((item) => (
                <li key={item.key} className="flex items-start gap-2 text-sm text-slate-soft">
                  <Settings size={15} className="mt-1 shrink-0 text-brand-500" />
                  <span>
                    <strong className="font-600 text-ink">
                      {t(`device.${item.key}Label`)}
                    </strong>{' '}
                    {item.path}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:flex-col">
          {/* A fixed 220px from sm up, not `w-auto`: the dialler sizes itself
              with `w-full max-w-[220px]`, and inside a shrink-to-fit parent a
              percentage width stops contributing, so the column collapsed to
              the width of the Copy button and squashed the keypad. */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-[220px]">
            <DiallerMock />
            <CopyCode />
          </div>
          <ArrowRight
            size={22}
            className="hidden shrink-0 text-slate-soft sm:block lg:rotate-90"
            aria-hidden
          />
          <ResultMock />
        </div>
      </div>

      {/* The decision, stated plainly: the presence of an EID is the whole test. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-brand-200 bg-brand-50/40 p-5 dark:border-brand-400/30 dark:bg-brand-500/10">
          <p className="flex items-center gap-2 font-700 text-brand-700 dark:text-brand-200">
            <Check size={18} /> {t('device.yesTitle')}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-soft">{t('device.yesText')}</p>
          <Button to="/destinations" className="mt-4 w-fit px-5 py-2.5 text-sm">
            {t('device.yesCta')} <ArrowRight size={16} />
          </Button>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 font-700 text-ink">
            <X size={18} className="text-slate-soft" /> {t('device.noTitle')}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-soft">{t('device.noText')}</p>
          <Button to="/support" variant="ghost" className="mt-4 w-fit px-5 py-2.5 text-sm">
            {t('device.noCta')}
          </Button>
        </Card>
      </div>

      <p className="mt-8 rounded-xl bg-mist p-4 text-xs leading-6 text-slate-soft">
        {t('device.privacyNote')}
      </p>
    </div>
  )
}
