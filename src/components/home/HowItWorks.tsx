import { ArrowRight, Check, ChevronRight, Download, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Flag from '../Flag'
import Reveal from '../Reveal'

/**
 * "Getting connected — three steps", drawn as the three screens it actually is.
 *
 * It used to be three cards carrying an icon and a sentence each. The sentences
 * were accurate and told a first-time buyer nothing: "choose a plan" is not a
 * description of anything they have not already guessed. What they do not know
 * is what the thing looks like — that the QR arrives on screen rather than in
 * the post, and that connecting is a switch rather than a shop visit.
 *
 * So each step shows its own screen instead of describing it. Everything inside
 * them is `aria-hidden`: it is a picture of the product, not a control, and a
 * screen reader reading out a fake search field and three country names would
 * be describing furniture. The step titles carry the meaning and stay in the
 * list, which is what gives "1 of 3" for free.
 */
export default function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    /* Short titles of their own: `step1Title` and friends begin with "1 · ",
       written for a layout that had no numbered badge. Here the badge carries
       the number and the title would print it twice. */
    { title: t('home.hwStep1'), mock: <PlanMock /> },
    { title: t('home.hwStep2'), mock: <QrMock /> },
    { title: t('home.hwStep3'), mock: <ReadyMock /> },
  ]

  return (
    <section id="how" className="hw py-12 sm:py-16">
      <div className="container-page">
        <Reveal>
          <h2 className="hw-title">
            {t('home.howLead')} <span>{t('home.howAccent')}</span>
          </h2>
        </Reveal>

        <ol className="hw-panel">
          {steps.map((step, i) => (
            <li key={step.title} className="hw-col">
              <Reveal delay={i * 80}>
                <div className="hw-head">
                  <span className="hw-num" aria-hidden>
                    {i + 1}
                  </span>
                  <h3>{step.title}</h3>
                </div>
                <div className="hw-mock" aria-hidden>
                  {step.mock}
                </div>
              </Reveal>
              {i < steps.length - 1 && (
                <span className="hw-arrow" aria-hidden>
                  <ArrowRight size={19} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="hw-cta">
          <Link to="/destinations" className="hw-btn focus-ring">
            {t('home.howCta')}
            <ArrowRight size={19} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

/** Step one: the catalogue, with one destination already chosen. */
function PlanMock() {
  const { t } = useTranslation()
  const rows: [string, string, boolean][] = [
    ['TR', t('home.mockTurkey'), true],
    ['AE', t('home.mockUae'), false],
    ['US', t('home.mockUsa'), false],
  ]
  return (
    <>
      <span className="hw-search">
        <Search size={16} />
      </span>
      <ul className="hw-list">
        {rows.map(([iso, name, on]) => (
          <li key={iso} className={on ? 'is-on' : ''}>
            <Flag iso2={iso} w={80} className="hw-flag" />
            <span>{name}</span>
            {on ? (
              <span className="hw-check">
                <Check size={13} strokeWidth={3} />
              </span>
            ) : (
              <ChevronRight size={16} className="hw-chev" />
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Step two: the code itself.
 *
 * Drawn from a fixed pattern rather than encoded from a real payload — it is a
 * picture of a QR code in a diagram, and a scannable one here would point a
 * customer's camera at whatever we had baked into it months ago.
 */
function QrMock() {
  const cells: string[] = []
  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 21; x += 1) {
      const finder =
        (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
          ? (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5)) &&
            !(x === 7 || y === 7)
          : null
      const on =
        finder === null
          ? // A fixed, deterministic scatter at roughly the density of a real
            // code, so it reads as one at a glance.
            ((x * 5 + y * 9 + ((x * y) % 7) + ((x + y) % 3)) % 2 === 0)
          : finder
      if (on) cells.push(`M${x} ${y}h1v1h-1z`)
    }
  }
  return (
    <div className="hw-qr-wrap">
      <svg className="hw-qr" viewBox="0 0 21 21" role="presentation">
        <path d={cells.join('')} fill="#0b2a44" />
      </svg>
      <span className="hw-dl">
        <Download size={18} />
      </span>
    </div>
  )
}

/** Step three: the line is on. */
function ReadyMock() {
  const { t } = useTranslation()
  return (
    <>
      <div className="hw-bar">
        <svg viewBox="0 0 22 16" className="hw-signal" role="presentation">
          <rect x="0" y="11" width="4" height="5" rx="1" />
          <rect x="6" y="7.5" width="4" height="8.5" rx="1" />
          <rect x="12" y="4" width="4" height="12" rx="1" />
          <rect x="18" y="0" width="4" height="16" rx="1" />
        </svg>
        <span className="hw-toggle" />
      </div>
      <div className="hw-done">
        <span className="hw-done-mark">
          <Check size={26} strokeWidth={3} />
        </span>
        <p>{t('home.mockReady')}</p>
      </div>
    </>
  )
}
