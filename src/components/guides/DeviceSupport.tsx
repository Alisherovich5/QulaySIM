import { useTranslation } from 'react-i18next'
import { Check, Smartphone, X } from 'lucide-react'
import { DEVICE_BRANDS } from '../../data/esimDevices'
import { deviceSummary } from '../../lib/device-summary'

/**
 * Which phones have an eSIM — the question people arrive with, in the words
 * they search for it.
 *
 * Counted off the same table /device-check searches, so the two can never
 * disagree and no figure here has to be maintained by hand.
 */
export default function DeviceSupport() {
  const { i18n } = useTranslation()
  const lang = ((i18n.resolvedLanguage ?? 'uz').split('-')[0] || 'uz') as 'uz' | 'ru' | 'en'
  const s = deviceSummary(DEVICE_BRANDS, lang)

  return (
    <section className="guide-devices">
      <h2>{s.heading}</h2>
      <p>{s.lead}</p>
      <ul className="guide-devices-list">
        {s.rows.map((row) => (
          <li key={row}>
            <Check size={16} aria-hidden />
            <span>{row}</span>
          </li>
        ))}
      </ul>

      <h3>{s.noneHeading}</h3>
      <p className="guide-devices-none">
        <X size={16} aria-hidden />
        <span>{s.noneText}</span>
      </p>

      <h3>{s.checkHeading}</h3>
      <ol className="guide-devices-steps">
        {s.checkSteps.map((step) => (
          <li key={step}>
            <Smartphone size={15} aria-hidden />
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
