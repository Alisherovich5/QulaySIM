import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Phone,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  User,
  Wifi,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import { Button, Card, IconBadge } from '../components/ui'

const DIAL_CODE = '*#06#'

/* ------------------------------------------------------------------------ *
 * The two phone mock-ups
 *
 * Everything between here and `CopyCode` draws a *picture of an iPhone*. It is
 * not part of the product's surface, which is why it carries bare iOS hexes
 * (#000, #1c1c1e, #30d158, #0a84ff) instead of design tokens and why it does
 * not flip with the theme: the iOS dialler is black on a light page too, and
 * repainting it in brand teal would stop it reading as the thing being copied.
 * Everything *around* the phones — frame glow, captions, panels — uses tokens
 * and does flip. That split is deliberate; please keep it.
 *
 * A real screenshot of this screen would carry the owner's actual EID and
 * IMEI, which are device identifiers. So the numbers are invented and the
 * barcodes are decorative bars rather than scannable codes — `privacyNote`
 * and `mockSheetNote` both say so, and both have to stay true.
 *
 * Sizing: the screen is a container (`container-type: inline-size`) with a
 * real iPhone aspect ratio, and every measurement inside it is in `cqw`. So
 * the whole device scales as one drawing — at the 330px cap a key comes out
 * ~73px across with a 32px numeral, exactly the proportions of the source
 * screenshot, and it stays in proportion at any smaller column width.
 * ------------------------------------------------------------------------ */

/* The mock imitates iOS, so it borrows the platform UI font rather than the
   site's Inter — partly for the shape, mostly because Inter is only loaded at
   400+ and the dialled-number line has to render as genuinely light. */
const IOS_FONT =
  'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'

const SCREEN_STYLE: CSSProperties = { containerType: 'inline-size', fontFamily: IOS_FONT }

/** iPhone body → machined bezel edge → screen. Three layers, because one
 *  border reads as a rounded rectangle and a phone reads as an edge catching
 *  light. */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="group/phone relative w-full">
      {/* Ambient bounce light under the device so it sits *on* the panel
          instead of floating in front of it. Token-based, so it warms up in
          dark mode instead of turning into a grey smudge. */}
      <span className="pointer-events-none absolute inset-x-4 bottom-2 top-10 rounded-[3rem] bg-brand-500/20 blur-2xl dark:bg-brand-400/20" />

      <div className="relative rounded-[44px] bg-[linear-gradient(150deg,#7b7b85_0%,#2a2a2e_13%,#141416_50%,#26262a_86%,#84848e_100%)] p-[3px] shadow-[0_32px_64px_-28px_rgba(4,18,24,0.7),0_12px_28px_-14px_rgba(4,18,24,0.45)] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover/phone:-translate-y-1.5">
        <div className="rounded-[41px] bg-black p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]">
          <div
            className="relative aspect-[393/852] overflow-hidden rounded-[38px] bg-black text-white"
            style={SCREEN_STYLE}
          >
            {children}
            {/* Home indicator */}
            <span className="pointer-events-none absolute inset-x-0 bottom-[2.1cqw] flex justify-center">
              <span className="h-[1.1cqw] w-[34cqw] rounded-full bg-white/50" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Status row with the dynamic island floating over it, exactly where iOS
 *  puts it. Drawn rather than iconographic so it scales with the container. */
function StatusBar() {
  return (
    <div className="relative flex h-[12cqw] shrink-0 items-center justify-between px-[8cqw] pt-[1.6cqw]">
      <span className="text-[3.5cqw] font-600 tracking-[0.01em] tabular-nums">9:41</span>

      <span className="absolute left-1/2 top-[2.4cqw] flex h-[8.4cqw] w-[29cqw] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[2.8cqw] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
        <span className="h-[3cqw] w-[3cqw] rounded-full bg-[#05070a] shadow-[inset_0_0_0_1px_rgba(120,150,180,0.35)]" />
      </span>

      <span className="flex items-center gap-[1.7cqw]">
        <span className="flex items-end gap-[0.5cqw]">
          {[1.5, 2.2, 2.9, 3.6].map((h, i) => (
            <span
              key={i}
              className="w-[0.9cqw] rounded-[0.2cqw] bg-white"
              style={{ height: `${h}cqw` }}
            />
          ))}
        </span>
        <Wifi className="h-[3.6cqw] w-[3.6cqw]" strokeWidth={3} />
        <span className="relative flex h-[3.5cqw] w-[6.8cqw] items-center rounded-[1.1cqw] p-[0.5cqw] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
          <span className="h-full w-[70%] rounded-[0.6cqw] bg-white" />
          <span className="absolute -right-[1cqw] top-1/2 h-[1.3cqw] w-[0.7cqw] -translate-y-1/2 rounded-r-[0.4cqw] bg-white/45" />
        </span>
      </span>
    </div>
  )
}

interface Key {
  d: string
  /** letter row under the numeral; `undefined` = bare, vertically centred glyph */
  sub?: string
  /** nudge for bare glyphs, whose ink does not fill the line box */
  dy?: string
  size?: string
}

const KEYS: Key[] = [
  { d: '1', sub: '' },
  { d: '2', sub: 'ABC' },
  { d: '3', sub: 'DEF' },
  { d: '4', sub: 'GHI' },
  { d: '5', sub: 'JKL' },
  { d: '6', sub: 'MNO' },
  { d: '7', sub: 'PQRS' },
  { d: '8', sub: 'TUV' },
  { d: '9', sub: 'WXYZ' },
  /* The asterisk's ink sits in the top third of its line box and is small for
     its point size, so it is scaled up and pushed down to land where iOS puts
     it — optically centred in the key rather than mathematically centred. */
  { d: '*', dy: '3.4cqw', size: '15cqw' },
  { d: '0', sub: '+' },
  { d: '#', dy: '0.6cqw', size: '9.8cqw' },
]

const TABS = [
  { label: 'Favourites', icon: <Star className="h-[6.3cqw] w-[6.3cqw]" strokeWidth={1.9} /> },
  { label: 'Recents', icon: <Clock className="h-[6.3cqw] w-[6.3cqw]" strokeWidth={1.9} /> },
  { label: 'Contacts', icon: <User className="h-[6.3cqw] w-[6.3cqw]" strokeWidth={1.9} /> },
  { label: 'Keypad', icon: <KeypadGlyph /> },
]

/** The nine-dot keypad tab icon, drawn so it scales with the container. */
function KeypadGlyph() {
  return (
    <span className="grid grid-cols-3 gap-[0.9cqw]">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="h-[1.5cqw] w-[1.5cqw] rounded-full bg-current" />
      ))}
    </span>
  )
}

function DiallerMock() {
  return (
    <PhoneFrame>
      <div data-mock="dialler-screen" className="flex h-full flex-col">
        <StatusBar />

        {/* The dialled code takes the slack, which is what gives it the wide
            band of black above and below that the real screen has. */}
        <div className="flex flex-1 items-center justify-center px-[6cqw]">
          <p
            data-mock="dialcode"
            className="text-center text-[12cqw] leading-none tracking-[0.09em] text-white [font-weight:300]"
          >
            {DIAL_CODE}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-[7.7cqw] gap-y-[5cqw] px-[7.7cqw]">
          {KEYS.map((k) => (
            <span
              key={k.d}
              data-mock="key"
              className="grid aspect-square place-items-center rounded-full bg-[#1c1c1e] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
            >
              {k.sub === undefined ? (
                <span
                  className="leading-none text-white"
                  style={{ fontSize: k.size, transform: `translateY(${k.dy})` }}
                >
                  {k.d}
                </span>
              ) : (
                <span className="flex flex-col items-center leading-none">
                  <span
                    data-mock="numeral"
                    className="text-[10.1cqw] font-400 leading-none text-white"
                  >
                    {k.d}
                  </span>
                  <span
                    data-mock="letters"
                    className="mt-[1.5cqw] h-[3.2cqw] text-[3.1cqw] font-500 leading-none tracking-[0.2em] text-white/65 [text-indent:0.2em]"
                  >
                    {k.sub}
                  </span>
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="mt-[6.5cqw] flex justify-center">
          <span
            data-mock="callbtn"
            className="grid h-[23.1cqw] w-[23.1cqw] place-items-center rounded-full bg-[#30d158] shadow-[0_0.4cqw_1cqw_rgba(48,209,88,0.22)]"
          >
            <Phone className="h-[9.8cqw] w-[9.8cqw] fill-white text-white" strokeWidth={0} />
          </span>
        </div>

        <div className="mt-[6cqw] border-t border-white/10 px-[2cqw] pb-[7cqw] pt-[2.6cqw]">
          <div className="grid grid-cols-4">
            {TABS.map((tab, i) => (
              <span
                key={tab.label}
                className={`flex flex-col items-center gap-[1.4cqw] ${
                  i === TABS.length - 1 ? 'text-[#0a84ff]' : 'text-white/45'
                }`}
              >
                {tab.icon}
                <span className="text-[2.7cqw] font-500 leading-none">{tab.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

/**
 * Bars only — a picture of a barcode, not a working one. Widths come from the
 * sample digits so the two codes differ from each other and never change
 * between renders; `flex-grow` keeps them crisp at any container width.
 */
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

function IdBlock({ label, bars }: { label: ReactNode; bars: ReturnType<typeof barPattern> }) {
  return (
    <div className="w-full">
      <p className="text-center text-[3.4cqw] font-500 leading-none text-white/55 tabular-nums">
        {label}
      </p>
      <div className="mt-[2.8cqw] flex h-[26cqw] items-stretch overflow-hidden rounded-[1.6cqw] bg-white px-[3cqw] py-[2.6cqw]">
        {bars.map((b, i) => (
          <span key={i} className={b.on ? 'bg-black' : ''} style={{ flex: b.w }} />
        ))}
      </div>
    </div>
  )
}

function ResultMock() {
  const { t } = useTranslation()
  return (
    <PhoneFrame>
      <div data-mock="result-screen" className="flex h-full flex-col bg-[#1c1c1e]">
        <StatusBar />

        <div className="px-[6.5cqw] pt-[3cqw]">
          <span className="grid h-[9.5cqw] w-[9.5cqw] place-items-center rounded-full bg-white/12">
            <X className="h-[4.8cqw] w-[4.8cqw] text-white/70" strokeWidth={3} />
          </span>
        </div>

        <div className="px-[6.5cqw] pt-[5cqw]">
          <p className="text-[9cqw] font-700 leading-[1.08] tracking-[-0.02em] text-white">
            {t('device.resultTitle')}
          </p>
          <p className="mt-[3.4cqw] text-[3.7cqw] leading-[1.5] text-white/55">
            {t('device.mockSheetNote', {
              defaultValue: 'Sample values. The bars are a drawing, not a scannable code.',
            })}
          </p>
        </div>

        {/* Weighted above centre: a real sheet fills from the top and leaves
            its slack above the action, not around the content. */}
        <div className="flex flex-1 flex-col justify-center gap-[9cqw] px-[6.5cqw] pb-[20cqw]">
          <IdBlock
            label={<>EID 8904&thinsp;9032&thinsp;0074&thinsp;…&thinsp;1234</>}
            bars={BARS_EID}
          />
          <IdBlock label={<>IMEI 3514&thinsp;2108&thinsp;…&thinsp;6897</>} bars={BARS_IMEI} />
        </div>

        <div className="px-[6.5cqw] pb-[8cqw]">
          <span className="flex h-[13cqw] items-center justify-center rounded-full bg-[#0a84ff] text-[4.2cqw] font-600 text-white">
            {t('device.mockDone', { defaultValue: 'Done' })}
          </span>
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ---------------------------- end of the drawing --------------------------- */

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
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-canvas px-5 py-2.5 text-sm font-600 text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:hover:text-brand-300"
    >
      {copied ? (
        <Check size={16} className="text-brand-600 dark:text-brand-300" />
      ) : (
        <Copy size={16} />
      )}
      {copied ? t('device.copied') : t('device.copyCode')}
    </button>
  )
}

/** Caption above each mock: the phones are pictures, so the label has to carry
 *  the meaning for anyone who cannot see them. */
function MockCaption({ n, children }: { n: number; children: ReactNode }) {
  return (
    <figcaption className="mb-4 flex items-center gap-2 text-[11px] font-700 uppercase tracking-[0.14em] text-slate-soft">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/12 text-[10px] leading-none text-brand-600 dark:text-brand-300">
        {n}
      </span>
      {children}
    </figcaption>
  )
}

const CTA_FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface'

export default function DeviceCheck() {
  const { t } = useTranslation()

  const steps = [
    { icon: Phone, key: 'dial' },
    { icon: Smartphone, key: 'read' },
    { icon: Check, key: 'decide' },
  ] as const

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
        className="-ml-2 -mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-600 text-slate-soft transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft size={15} /> {t('device.back')}
      </Link>

      <header className="mt-6 max-w-2xl">
        <IconBadge icon={Smartphone} size="lg" />
        <h1 className="mt-4 font-display text-2xl font-700 leading-tight text-ink sm:text-4xl">
          {t('device.title')}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-soft sm:text-lg sm:leading-8">
          {t('device.intro')}
        </p>
      </header>

      {/* Steps read as a sequence, so they get numerals and equal-height cards
          rather than a bulleted list squeezed into one column. */}
      <section className="mt-8 sm:mt-12">
        <h2 className="font-display text-lg font-700 text-ink sm:text-xl">
          {t('device.stepsTitle')}
        </h2>
        <ol className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.key} className="h-full">
              <Card className="h-full p-5 transition-shadow duration-300 hover:shadow-lg hover:shadow-brand-500/5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <IconBadge icon={step.icon} size="md" />
                  <span
                    aria-hidden
                    /* An opacity of the body colour, not `text-line`: the line
                       token is nearly the surface colour in dark and the
                       numeral vanished into the card. */
                    className="font-display text-2xl font-700 leading-none text-slate-soft/30"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-4 font-display text-[15px] font-700 leading-snug text-ink">
                  <span className="sr-only">{i + 1}. </span>
                  {t(`device.steps.${step.key}.title`)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-soft">
                  {t(`device.steps.${step.key}.text`)}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* The two mocks sit side by side because the answer is the comparison:
          you dial on the left and look for an EID on the right. They get the
          full page width — squeezed into a side column they stopped reading as
          phones at all. */}
      <Reveal>
        <section className="relative mt-8 overflow-hidden rounded-3xl bg-surface p-4 ring-1 ring-line sm:mt-12 sm:p-6 lg:p-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_-10%,var(--color-brand-500)_0%,transparent_62%)] opacity-[0.06] dark:opacity-20"
          />
          <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-6 lg:gap-10">
            <figure className="flex w-full max-w-[330px] flex-col items-center md:w-[288px] lg:w-[330px]">
              <MockCaption n={1}>
                {t('device.mockDialLabel', { defaultValue: 'What you type' })}
              </MockCaption>
              <div data-mock="dialler-wrap" className="w-full">
                <DiallerMock />
              </div>
              <div className="mt-5">
                <CopyCode />
              </div>
            </figure>

            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-brand-500 shadow-sm ring-1 ring-line dark:text-brand-300 md:self-center"
            >
              <ArrowRight size={16} className="rotate-90 md:rotate-0" />
            </span>

            <figure className="flex w-full max-w-[330px] flex-col items-center md:w-[288px] lg:w-[330px]">
              <MockCaption n={2}>
                {t('device.mockResultLabel', { defaultValue: 'What you see' })}
              </MockCaption>
              <div data-mock="result-wrap" className="w-full">
                <ResultMock />
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3.5 py-2 text-xs font-700 text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-200">
                <Check size={14} /> {t('device.eidFound')}
              </p>
            </figure>
          </div>
        </section>
      </Reveal>

      <Card className="mt-6 p-5 sm:mt-8 sm:p-6">
        <div className="flex items-start gap-3.5">
          <IconBadge icon={Settings} size="md" />
          <div className="min-w-0">
            <h2 className="font-display text-base font-700 text-ink sm:text-lg">
              {t('device.settingsTitle')}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-soft">
              {t('device.settingsIntro')}
            </p>
          </div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {settingsPaths.map((item) => (
            <li
              key={item.key}
              className="min-w-0 rounded-xl bg-canvas px-4 py-3.5 ring-1 ring-line"
            >
              <p className="text-sm font-700 text-ink">{t(`device.${item.key}Label`)}</p>
              <p className="mt-1 break-words text-sm leading-6 text-slate-soft">{item.path}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* The decision, stated plainly: the presence of an EID is the whole test. */}
      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
        <Card className="relative overflow-hidden bg-brand-50/50 p-5 ring-brand-200 motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1 sm:p-6 dark:bg-brand-500/10 dark:ring-brand-400/30">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand-500/15 blur-2xl"
          />
          <div className="relative">
            <IconBadge icon={Check} size="md" />
            <p className="mt-4 font-display text-lg font-700 text-brand-700 dark:text-brand-200">
              {t('device.yesTitle')}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-soft">{t('device.yesText')}</p>
            <Button
              to="/destinations"
              className={`mt-5 min-h-11 w-fit px-5 py-2.5 text-sm ${CTA_FOCUS}`}
            >
              {t('device.yesCta')} <ArrowRight size={16} />
            </Button>
          </div>
        </Card>

        <Card className="p-5 motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1 sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas text-slate-soft ring-1 ring-line">
            <X size={20} />
          </span>
          <p className="mt-4 font-display text-lg font-700 text-ink">{t('device.noTitle')}</p>
          <p className="mt-2 text-sm leading-6 text-slate-soft">{t('device.noText')}</p>
          <Button
            to="/support"
            variant="ghost"
            className={`mt-5 min-h-11 w-fit px-5 py-2.5 text-sm ${CTA_FOCUS}`}
          >
            {t('device.noCta')}
          </Button>
        </Card>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line sm:mt-8 sm:p-5">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-300" />
        <p className="text-xs leading-6 text-slate-soft sm:text-[13px]">
          {t('device.privacyNote')}
        </p>
      </div>
    </div>
  )
}
