import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Lock, X } from 'lucide-react'


/**
 * The payment form, on our page rather than on the provider's.
 *
 * The card fields live inside the provider's own iframe, so the numbers travel
 * from the customer's browser straight to them: nothing card-shaped ever
 * reaches our server, and our PCI obligation stays the light one. What changes
 * is only where the customer stands while typing — they never leave qulaysim.uz,
 * which is the difference between "I paid on QulaySIM" and "I was sent
 * somewhere else and hoped".
 *
 * Deliberately NOT the provider's direct card API. That variant would have the
 * PAN pass through our own request handlers, which turns a 22-question
 * compliance form into a 300-question one with quarterly scans, and turns any
 * future XSS on this site from an annoyance into a card-skimming incident.
 *
 * The escape hatch matters: if the frame is blocked — a privacy extension, a
 * corporate proxy, a provider that starts sending X-Frame-Options — the
 * customer still has a working link instead of a blank rectangle.
 */
export default function PaymentFrame({ url, onClose }: { url: string; onClose: () => void }) {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)

  // Escape closes it, and the page behind must not scroll while a payment is
  // open — a half-scrolled checkout under a payment form reads as two pages.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-brand-950/70 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('checkout.payFrameTitle')}
    >
      {/* Edge to edge on a phone, a centred card from `sm` up. The provider's form
          is taller than a padded dialog leaves room for, so on a phone it was cut
          off mid-way through the card fields and the customer had to scroll
          *inside* the frame to reach the pay button — a scrollbar they cannot see,
          in a box they did not expect to scroll.

          `100dvh` rather than `100vh`: with the mobile browser's own bars counted
          in, `vh` is taller than what is visible and pushes the bottom of the form
          back underneath them. */}
      <div
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-surface shadow-2xl ring-line sm:h-auto sm:max-h-full sm:max-w-lg sm:rounded-2xl sm:ring-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-700">
            <Lock size={15} className="text-brand-500 dark:text-accent-400" aria-hidden />
            {t('checkout.payFrameTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('checkout.payCancel')}
            className="focus-ring grid h-11 w-11 place-items-center rounded-xl text-slate-soft transition hover:bg-mist hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* `flex-1` with a full-height iframe rather than a fixed height, so the
            frame takes whatever the header leaves and the form gets the screen. */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
          {!loaded && (
            <p className="absolute inset-0 grid place-items-center text-sm text-slate-soft">
              {t('checkout.payOpening')}
            </p>
          )}
          <iframe
            src={url}
            title={t('checkout.payFrameTitle')}
            onLoad={() => setLoaded(true)}
            className="h-full min-h-[420px] w-full border-0"
            // The provider needs forms and its own scripts; nothing else is
            // granted. allow-same-origin is required for its session to work
            // and is safe here because the frame is a different origin.
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
          />
        </div>

        <div className="shrink-0 border-t border-line px-4 py-2">
          <p className="text-[11px] leading-4 text-slate-soft">{t('checkout.payFrameNote')}</p>
          {/* The escape hatch, shown only while the form has not appeared.
              As a second full-width button under "Confirm payment" it read as a
              second thing to do — the owner asked why there were two windows at
              all — and most people never need it. It cannot simply be deleted:
              some browsers refuse third-party frames outright, and then this
              link is the only way to pay.

              A plain anchor, not the Button component: that one renders a router
              Link or a <button>, and this has to leave the site. */}
          {!loaded && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-2.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-600 text-brand-600 ring-1 ring-line transition hover:bg-mist dark:text-accent-400"
            >
              {t('checkout.payFallback')} <ExternalLink size={13} aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
