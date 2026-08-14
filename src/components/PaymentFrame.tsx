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
        // On a phone the sheet is the screen. On a desktop it was `h-auto` inside
        // `max-h-full`, so the panel took only as much height as the layout gave
        // it and the provider's form was cut off part-way down — the same inner
        // scrollbar the phone had, moved to the laptop. A definite height fixes
        // it: 88% of the window, capped so it does not become a strip on a very
        // tall display, and a little wider so the card fields are not cramped.
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-surface shadow-2xl ring-line sm:h-[min(88vh,880px)] sm:max-w-xl sm:rounded-2xl sm:ring-1"
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

        {/* The provider's page opens on the card form, with CLICK and PAYME
            folded away under "Boshqa usuli" — the screenshot proves it: even in
            a 880px sheet that section sits collapsed at the fold. A customer who
            came to pay with Click sees a card form and concludes that is all we
            take. We cannot restyle that page (different origin, and the links
            behind those buttons are minted by their server), so the honest fix
            is to say up front what is inside it. Names as text, not logos: no
            third-party asset to host and nothing for the CSP to block. */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-mist/70 px-4 py-2">
          <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-700 uppercase tracking-wide text-white">
            {t('checkout.payMethodCard')}
          </span>
          <span className="rounded-md bg-[#0F86D8] px-1.5 py-0.5 text-[10px] font-700 text-white">Click</span>
          <span className="rounded-md bg-[#00C4B4] px-1.5 py-0.5 text-[10px] font-700 text-white">Payme</span>
          <span className="text-[11px] leading-4 text-slate-soft">{t('checkout.payMethodsHint')}</span>
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
            // The provider needs forms and its own scripts. `allow-same-origin`
            // is required for its session to work and is safe here because the
            // frame is a different origin.
            //
            // The two popup permissions are what make CLICK and PAYME work.
            // Both hand the customer off by calling `window.open()` — the button
            // carries a perfectly good my.click.uz URL — and a sandboxed frame
            // without `allow-popups` blocks that silently: no error, no new tab,
            // a button that simply does nothing. `allow-popups-to-escape-sandbox`
            // then lets the opened page run unsandboxed, since inheriting these
            // restrictions would break the payment page it lands on instead.
            //
            // The cost is worth naming: this frame can now open windows. It is
            // the payment provider's own origin, which is already trusted with
            // the card number, so the added reach is small — but it is not zero.
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups allow-popups-to-escape-sandbox"
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
