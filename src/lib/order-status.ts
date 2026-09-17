import { api } from './api'
import type { Order } from './types'

/**
 * Whether an order has actually been paid for, asked after the payment window
 * closes.
 *
 * The frame is the provider's own origin, so nothing inside it can be read from
 * here — closing it means "the customer is finished with that window", which is
 * not the same as "the money moved". The only side that knows is ours: the
 * provider confirms the charge to the API, and `/account/orders` lists settled
 * orders only. So an order appearing in that list IS the confirmation.
 *
 * Polled rather than asked once, because the confirmation arrives on a call
 * from the provider to our server, which can land a second or two after the
 * customer sees "paid" on their screen. Four attempts over ~4.5 s covers that
 * without leaving somebody watching a spinner: a slower confirmation is not
 * lost, it just shows up in the account a moment later, which is what the
 * unconfirmed message says.
 */
const ATTEMPTS = 4
const DELAY_MS = 1500

export async function isOrderSettled(orderId: number): Promise<boolean> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    try {
      const { data } = await api.get<Order[]>('/account/orders')
      if (data.some((order) => order.id === orderId)) return true
    } catch {
      // A lost request is not an answer. Keep asking; the caller treats
      // "never confirmed" as unknown, never as "not paid".
    }
  }
  return false
}
