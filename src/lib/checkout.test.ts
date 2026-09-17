/**
 * The two rules that stand between one cart and two charges.
 *
 * `checkoutKey` is what the API's duplicate-order guard keys on, so what
 * matters is exactly when it stays the same and when it must not. And
 * `isOrderSettled` is the only thing that can tell a paid order from a closed
 * window, since the payment frame is a different origin and cannot be asked.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'
import { checkoutKey } from './checkout-key'
import { isOrderSettled } from './order-status'
import type { CartItem, Plan } from './types'

const plan = (id: number, price = 10): Plan => ({
  id,
  scope: 'country',
  title: `Plan ${id}`,
  data_amount_mb: 1024,
  is_unlimited: false,
  data_label: '1 GB',
  validity_days: 7,
  price_usd: price,
  price_note: '',
  network_type: '4G',
  supports_hotspot: true,
  is_popular: false,
})

const item = (id: number, quantity = 1): CartItem => ({
  plan: plan(id),
  countryName: 'Turkiya',
  iso2: 'TR',
  quantity,
})

describe('the idempotency key for a cart', () => {
  it('is the same cart however it is ordered', () => {
    expect(checkoutKey([item(1), item(2)], null)).toBe(checkoutKey([item(2), item(1)], null))
  })

  it('changes when a quantity changes', () => {
    expect(checkoutKey([item(1, 1)], null)).not.toBe(checkoutKey([item(1, 2)], null))
  })

  it('changes when a plan changes', () => {
    expect(checkoutKey([item(1)], null)).not.toBe(checkoutKey([item(2)], null))
  })

  // A discount changes what is owed, so it is a different order — and rotating
  // the key is also how a customer escapes an order that can no longer be paid.
  it('changes when a promo code is applied', () => {
    expect(checkoutKey([item(1)], null)).not.toBe(checkoutKey([item(1)], 'WELCOME10'))
  })

  it('does not depend on a price the browser happens to be holding', () => {
    const cheap: CartItem = { ...item(1), plan: plan(1, 5) }
    const dear: CartItem = { ...item(1), plan: plan(1, 500) }
    expect(checkoutKey([cheap], null)).toBe(checkoutKey([dear], null))
  })
})

describe('confirming that an order was actually paid', () => {
  /** Answers from /account/orders, one per call. */
  let answers: number[][]

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      length: 0, key: () => null, getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {},
    })
    api.defaults.adapter = async (config) => ({
      data: (answers.shift() ?? []).map((id) => ({ id, esims: [] })),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('says yes as soon as the order appears in the history', async () => {
    answers = [[41]]
    await expect(isOrderSettled(41)).resolves.toBe(true)
  })

  // The provider confirms the charge to our server, which can land a moment
  // after the customer sees "paid". One look would call that a failure.
  it('keeps asking while the confirmation is still in flight', async () => {
    vi.useFakeTimers()
    answers = [[], [], [41]]
    const settled = isOrderSettled(41)
    await vi.advanceTimersByTimeAsync(5000)
    await expect(settled).resolves.toBe(true)
  })

  it('gives up rather than guessing when it never appears', async () => {
    vi.useFakeTimers()
    answers = [[], [], [], []]
    const settled = isOrderSettled(41)
    await vi.advanceTimersByTimeAsync(10000)
    await expect(settled).resolves.toBe(false)
  })

  // A lost request is not an answer. On the network this shop is served over
  // that distinction is the difference between "not paid" and "ask again".
  it('treats a failed request as nothing learned, not as a refusal', async () => {
    vi.useFakeTimers()
    let call = 0
    api.defaults.adapter = async (config) => {
      call += 1
      if (call === 1) throw new Error('network')
      return { data: [{ id: 41, esims: [] }], status: 200, statusText: 'OK', headers: {}, config }
    }
    const settled = isOrderSettled(41)
    await vi.advanceTimersByTimeAsync(5000)
    await expect(settled).resolves.toBe(true)
  })
})
