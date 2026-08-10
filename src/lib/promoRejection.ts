import type { Quote } from './types'

/**
 * Why a promo code was refused, in the customer's language.
 *
 * The API used to send only prose, and the checkout showed it verbatim — so an
 * Uzbek customer typing an expired code read "Promo code has expired" in
 * English. Prose cannot be translated on the client without matching strings,
 * which breaks the moment someone rewords the server message; a slug can.
 *
 * The minimum-order case needs the figure. Told only that the order is too
 * small, a customer cannot act; `promo_min_order_usd` accompanies that slug for
 * exactly this sentence.
 *
 * An unrecognised slug falls back to the server's English rather than to
 * "something went wrong" — the wrong language still beats no reason, and a slug
 * added server-side before the storefront knows it should degrade quietly.
 */
export function promoRejection(
  quote: Pick<Quote, 'promo_reason' | 'promo_message' | 'promo_min_order_usd'>,
  t: (key: string, opts?: Record<string, unknown>) => string,
  formatPrice: (usd: number | null | undefined) => string,
): string {
  const keys: Record<string, string> = {
    promo_invalid: 'checkout.promoInvalid',
    promo_expired: 'checkout.promoExpired',
    promo_limit_reached: 'checkout.promoLimitReached',
    promo_first_order_only: 'checkout.promoFirstOrderOnly',
  }

  if (quote.promo_reason === 'promo_min_order' && quote.promo_min_order_usd != null) {
    return t('checkout.promoMinOrder', { amount: formatPrice(quote.promo_min_order_usd) })
  }

  const key = quote.promo_reason ? keys[quote.promo_reason] : undefined
  if (key) return t(key)
  return quote.promo_message || t('checkout.promoInvalid')
}
