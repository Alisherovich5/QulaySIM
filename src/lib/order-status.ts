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
    if (await orderHasSettled(orderId)) return true
  }
  return false
}

/**
 * The same question asked once, for a caller that is already asking on a clock
 * of its own.
 *
 * A lost request is not an answer: it returns false, and the caller keeps
 * asking. Nothing here ever concludes "not paid" — only "not confirmed yet".
 */
export async function orderHasSettled(orderId: number): Promise<boolean> {
  try {
    const { data } = await api.get<Order[]>('/account/orders')
    return data.some((order) => order.id === orderId)
  } catch {
    return false
  }
}
