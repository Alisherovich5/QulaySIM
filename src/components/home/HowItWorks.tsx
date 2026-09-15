import { ArrowRight, QrCode, Search, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Reveal from '../Reveal'

/** "How eSIM works" — three steps, drawn as the route they are.
 *
 * This was three identical cards in a row: same size, same weight, same
 * hairline, no indication that they happen in an order or that one of them is
 * the moment the product arrives. A visitor reading it had to work out the
 * sequence from the numbers inside the titles.
 *
 * It is an `<ol>` now, which is what it always was — a screen reader announces
 * "1 of 3" without our numbering it a second time, and the arrows between the
 * cards say the same thing to everyone else. The middle step is raised and
 * inverted because it is the one that matters: paying is where a visitor stops,
 * and "you get the QR immediately" is the answer to why they should not.
 */
export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    { icon: Search, title: t('home.step1Title'), text: t('home.step1Text') },
    { icon: QrCode, title: t('home.step2Title'), text: t('home.step2Text') },
    { icon: Smartphone, title: t('home.step3Title'), text: t('home.step3Text') },
  ]

  return (
    <section id="how" className="how-route border-y border-line py-12 sm:py-16">
      <div className="container-page">
        {/* The same editorial two-column head the destinations section uses:
            display heading left, one supporting line on the right. A centred
            heading with a centred subtitle under it is the shape of every
            template on the internet. */}
        <div className="how-route-head">
          <Reveal>
            <h2 className="font-display text-[1.75rem] font-700 leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {t('home.howTitle')}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="how-route-note">{t('home.howSubtitle')}</p>
          </Reveal>
        </div>

        <ol className="how-route-board mt-8 sm:mt-12">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              /* The <li> is the list item and the Reveal is inside it, not the
                 other way round: a <div> between <ol> and <li> is invalid, and
                 browsers drop the list semantics when they see one — which
                 would cost exactly the "1 of 3" this markup is here to get. */
              <li key={step.title} className="how-route-step">
                <Reveal delay={i * 80}>
                  <article>
                    <span className="how-route-icon">
                      <Icon size={20} strokeWidth={1.8} aria-hidden />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-700 text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-soft">{step.text}</p>
                  </article>
                </Reveal>
                {/* Decorative: the list already carries the order, and an arrow
                    announced between every item is three interruptions. */}
                {i < steps.length - 1 && (
                  <ArrowRight className="how-route-arrow" size={19} aria-hidden />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
