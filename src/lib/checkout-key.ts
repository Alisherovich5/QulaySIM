import type { CartItem } from './types'

/**
 * A stable name for "this exact cart", sent as `Idempotency-Key`.
 *
 * The API already knows how to refuse a duplicate order (see the backend's
 * services/orders.py), and it was the storefront that never gave it anything to
 * work with. The failure it prevents is not a race — the pay button disables
 * itself while a request is in flight — but the retry that survives losing that
 * state: a tab reloaded on a stalled request, a phone that reconnected and the
 * customer pressing pay again. Both produced a second order and a second
 * payment link for one cart, and the customer could pay both.
 *
 * Derived from the cart rather than generated, because a random key lives in
 * React state and a reload is exactly the case that needs covering. Sorted, so
 * that the same cart in a different order is the same cart. The promo code is
 * part of it: applying one changes what is owed, which is a different order.
 *
 * The key rotates whenever the cart does — but that is NOT the escape hatch,
 * and reading it as one was a mistake worth recording. A one-line cart is the
 * common case, and there is nothing in it to change: removing the only item
 * empties the cart, and adding it back rebuilds this exact string.
 *
 * What releases a stale key is the order it names no longer being pending. The
 * API refuses to replay anything else (see the backend's services/orders.py),
 * so a paid order does not block buying the same thing again, and a customer
 * sitting on a dead payment link cancels it — `startOver` in pages/Checkout —
 * and gets a new one. The key is unchanged; the order behind it is not.
 *
 * Nothing is hashed here; the API hashes it before it is stored, and scopes it
 * to the customer.
 */
export function checkoutKey(items: CartItem[], promoCode: string | null): string {
  const lines = items
    .map((item) => `${item.plan.id}x${item.quantity}`)
    .sort()
    .join(',')
  return `${lines}|${promoCode ?? ''}`
}
