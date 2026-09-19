import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import PriceTag from '../components/PriceTag'
import { useDesignCopy } from '../lib/design-copy'
import { CreditCard, Lock, LogIn, Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import Seo from '../components/Seo'
import PaymentFrame from '../components/PaymentFrame'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import { promoRejection } from '../lib/promoRejection'
import { checkoutKey } from '../lib/checkout-key'
import { isOrderSettled } from '../lib/order-status'
import Flag from '../components/Flag'
import { Button, Card } from '../components/ui'
import type { Quote } from '../lib/types'

export default function Checkout() {
  const c = useDesignCopy()
  const { items, setQuantity, remove, subtotal, clear } = useCart()
  const { customer } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const payTrigger = useRef<HTMLButtonElement>(null)
  const [payState, setPayState] = useState<
    | 'idle'
    | 'starting'
    | 'error'
    | 'unavailable'
    | 'confirming'
    | 'unconfirmed'
    | 'cancelBlocked'
  >('idle')
  /** The order the open payment window belongs to, so its outcome can be asked for. */
  const [orderId, setOrderId] = useState<number | null>(null)
  /**
   * Whether this screen is still the one on screen.
   *
   * Confirming a payment takes a few seconds of polling, and the customer is
   * free to leave during them — closing the window and tapping "Account" is an
   * entirely reasonable thing to do. The same `alive` guard the rest of the app
   * uses for a request that outlives its screen (see TopUpSheet, GoogleSignIn).
   */
  const onScreen = useRef(true)
  useEffect(() => {
    onScreen.current = true
    return () => {
      onScreen.current = false
    }
  }, [])

  /**
   * Ask the API to place the order and hand back a payment URL.
   *
   * The order is created server-side from the server's own prices — the cart in
   * this browser is a suggestion, not an authority — and the URL that comes
   * back belongs to whichever provider is configured. A 503 means no provider
   * is live yet, which is a different message from a failure.
   *
   * `Idempotency-Key` is what stops one cart becoming two orders. See
   * lib/checkout-key.ts for why it is derived from the cart rather than minted.
   */
  const startPayment = async (event: MouseEvent<HTMLButtonElement>) => {
    payTrigger.current = event.currentTarget
    setPayState('starting')
    try {
      const { data } = await api.post<{ order_id: number; payment_url: string }>(
        '/checkout',
        {
          items: items.map((i) => ({ plan_id: i.plan.id, quantity: i.quantity })),
          promo_code: appliedPromo || undefined,
        },
        { headers: { 'Idempotency-Key': checkoutKey(items, appliedPromo) } },
      )
      setOrderId(data.order_id)
      setPayUrl(data.payment_url)
      setPayState('idle')
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      setPayState(status === 503 ? 'unavailable' : 'error')
    }
  }

  /**
   * The payment window has been closed. Find out whether anything was paid.
   *
   * Closing the frame used to be the end of it: the cart stayed exactly as it
   * was, nothing moved, and a customer who had just paid was left looking at
   * the same "pay" button over the same items — with no way to tell whether it
   * had worked, and every reason to press it again.
   *
   * The frame is a different origin, so it cannot be asked. The API can: an
   * order that shows up in the customer's history has been settled. Confirmed
   * ones clear the cart and land on the eSIM tab, which is what the customer
   * opened the payment window to reach. Anything else leaves the cart untouched
   * — a cancelled payment must not throw a cart away — and says so.
   */
  const finishPayment = async () => {
    setPayUrl(null)
    if (orderId === null) return
    setPayState('confirming')
    const settled = await isOrderSettled(orderId)
    // Emptying the cart is not this screen's business to postpone: the cart
    // belongs to the whole app, and an order confirmed while the customer was
    // already walking away is paid for either way. Left in, those items are
    // waiting to be bought a second time. Only what this screen draws is
    // skipped once it is gone.
    if (settled) clear()
    if (!onScreen.current) return
    if (settled) {
      navigate('/account?tab=esims')
      return
    }
    setPayState('unconfirmed')
  }

  /**
   * "I did not pay" — give the pending order back so the next attempt is fresh.
   *
   * Needed because of where the idempotency key comes from. It is derived from
   * the cart, so a customer whose payment link has gone stale cannot ask for a
   * new one by rebuilding the cart: removing the only item and adding it again
   * produces the very same key, and the API replays the very same dead link.
   * Cancelling the order is what actually releases it — the API refuses to
   * replay anything that is not pending.
   *
   * Only ever reached from the "we could not confirm it" notice, so the
   * customer is the one asserting no money moved. If one did move after all,
   * the provider's confirmation arrives against a cancelled order, is refused,
   * and — with ATMOS, which asks before it debits — nothing is charged. A 409
   * is the API saying a payment is genuinely in flight; that is not a failure
   * to report as one, it is a reason to wait.
   */
  const startOver = async () => {
    if (orderId === null) {
      setPayState('idle')
      return
    }
    try {
      await api.post(`/checkout/${orderId}/cancel`)
      setOrderId(null)
      setPayState('idle')
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      setPayState(status === 409 ? 'cancelBlocked' : 'error')
    }
  }

  const { formatPrice } = useCurrency()

  const [promo, setPromo] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)

  /**
   * The cart is stored in the browser, so its prices can be stale by the time
   * checkout loads. The quote is the server's answer — prefer it, and fall
   * back to the stored copy only while the quote is still in flight.
   */
  const serverLineTotal = (planId: number) =>
    quote?.lines?.find((line) => line.plan_id === planId)?.line_total

  const priceChanged = items.some((item) => {
    const server = serverLineTotal(item.plan.id)
    return server != null && Math.abs(server - item.plan.price_usd * item.quantity) > 0.001
  })

  const payload = () => ({
    items: items.map((i) => ({ plan_id: i.plan.id, quantity: i.quantity })),
    promo_code: appliedPromo,
  })

  useEffect(() => {
    // Both notices describe the cart as it was a moment ago, so editing it
    // retires them: "we could not confirm the payment, your cart has been kept"
    // is a false statement about a cart that has since changed. `unavailable`
    // is not cleared — no provider is configured, and rearranging a cart does
    // not configure one.
    setPayState((state) =>
      state === 'unconfirmed' || state === 'error' || state === 'cancelBlocked' ? 'idle' : state,
    )
    if (items.length === 0) {
      setQuote(null)
      return
    }
    api
      .post<Quote>('/checkout/quote', payload())
      .then((r) => setQuote(r.data))
      .catch(() => setQuote(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, appliedPromo])

  const applyPromo = async () => {
    setPromoError(null)
    try {
      const { data } = await api.post<Quote>('/checkout/quote', {
        items: items.map((i) => ({ plan_id: i.plan.id, quantity: i.quantity })),
        promo_code: promo,
      })
      if (data.promo_applied) {
        setAppliedPromo(promo)
      } else {
        setPromoError(promoRejection(data, t, formatPrice))
        setAppliedPromo(null)
      }
    } catch {
      setPromoError(t('checkout.payFailed'))
    }
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="qs-page qs-checkout checkout-empty container-page">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-500">
            <ShoppingBag size={30} />
          </span>
          <h1 className="mt-5 text-2xl font-700">{t('checkout.emptyTitle')}</h1>
          <p className="mt-2 text-slate-soft">{t('checkout.emptySubtitle')}</p>
          <Button to="/destinations" className="mx-auto mt-6 w-fit px-6 py-3">
            {t('common.browseDestinations')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="qs-page qs-checkout container-page">
      <Seo title={t('seo.checkoutTitle')} description={t('seo.homeDescription')} noindex />
      <div className="page-intro">
        <p className="eyebrow">{c.checkoutLabel}</p>
        <h1>{t('checkout.title')}</h1>
        <p>{c.checkoutNote}</p>
      </div>
      {priceChanged && (
        <p className="mt-3 rounded-xl bg-gold-500/10 px-4 py-3 text-sm text-gold-700 ring-1 ring-gold-500/20 dark:text-gold-300">
          {t('checkout.priceUpdated')}
        </p>
      )}
      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.plan.id}
              className="card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:flex sm:gap-4"
            >
              <Flag
                iso2={item.iso2}
                alt={item.countryName}
                className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-line"
              />
              <div className="min-w-0">
                <p className="truncate font-600">{item.plan.title}</p>
                <p className="text-sm text-slate-soft">
                  {item.countryName} · {item.plan.network_type} · {item.plan.validity_days} {c.days}
                </p>
              </div>
              <div className="col-span-3 flex items-center justify-between gap-3 border-t border-line pt-3 sm:ml-auto sm:border-0 sm:pt-0">
                <div className="flex items-center gap-1 rounded-lg ring-1 ring-line">
                  <button
                    type="button"
                    aria-label={item.quantity <= 1 ? t('checkout.remove') : c.data + ' −1'}
                    /* At one, minus removes the line rather than doing
                       nothing. It used to stop at one and the customer had to
                       find the bin icon, which is a second control for the
                       same intention — pressing minus until it is gone is what
                       people do. */
                    onClick={() =>
                      item.quantity <= 1
                        ? remove(item.plan.id)
                        : setQuantity(item.plan.id, item.quantity - 1)
                    }
                    className="grid h-8 w-8 place-items-center text-slate-soft hover:text-brand-600"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-600">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={c.data + ' +1'}
                    onClick={() => setQuantity(item.plan.id, item.quantity + 1)}
                    className="grid h-8 w-8 place-items-center text-slate-soft hover:text-brand-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <PriceTag
                  usd={serverLineTotal(item.plan.id) ?? item.plan.price_usd * item.quantity}
                  size="sm"
                  className="items-end text-right"
                />
              </div>
              <button
                onClick={() => remove(item.plan.id)}
                className="col-start-3 row-start-1 grid h-8 w-8 place-items-center text-slate-soft hover:text-red-500 sm:order-last"
                aria-label={t('checkout.remove')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <h2 className="font-700">{t('checkout.summary')}</h2>

            <div className="mt-4">
              <label className="text-xs font-600 text-slate-soft" htmlFor="checkout-promo">
                {t('checkout.promoCode')}
              </label>
              <div className="mt-1.5 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3 ring-1 ring-line">
                  <Tag size={15} className="text-slate-soft" />
                  <input
                    id="checkout-promo"
                    name="promo"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                </div>
                <Button onClick={applyPromo} variant="ghost" className="px-4 py-2 text-sm">
                  {t('checkout.apply')}
                </Button>
              </div>
              {promoError && <p className="mt-1.5 text-xs text-red-500">{promoError}</p>}
              {appliedPromo && (
                <p className="mt-1.5 text-xs text-accent-600">
                  {t('checkout.promoApplied', { code: appliedPromo })}
                </p>
              )}
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-soft">{t('checkout.subtotal')}</dt>
                <dd className="font-600">{formatPrice(quote?.subtotal ?? subtotal)}</dd>
              </div>
              {quote && quote.discount > 0 && (
                <div className="flex justify-between text-accent-600">
                  <dt>{t('checkout.discount')}</dt>
                  <dd className="font-600">−{formatPrice(quote.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-700">{t('checkout.total')}</dt>
                <dd>
                  <PriceTag usd={quote?.total ?? subtotal} size="md" className="items-end" />
                </dd>
              </div>
            </dl>

            {/* An eSIM is delivered to an account, so payment cannot happen
                anonymously — the QR would have nowhere to go. Signing in is
                asked for here rather than on the way into the cart, so nobody
                is stopped from seeing what they are about to pay. */}
            {customer ? (
              <>
                {/* The provider is chosen server-side: this asks for a payment
                    URL and shows it in place. A 503 means none is configured
                    yet, so the copy falls back to "coming soon" rather than
                    leaving a button that cannot work. */}
                <Button
                  fullWidth
                  className="mt-5 py-3.5"
                  loading={payState === 'starting' || payState === 'confirming'}
                  disabled={
                    payState === 'starting' ||
                    payState === 'confirming' ||
                    payState === 'unavailable'
                  }
                  onClick={startPayment}
                >
                  {payState !== 'confirming' && <CreditCard size={18} />}
                  {payState === 'unavailable'
                    ? t('checkout.paymentSetup')
                    : payState === 'confirming'
                      ? t('checkout.confirming')
                      : t('checkout.payWithCard')}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-soft">
                  <Lock size={12} />
                  {payState === 'unavailable'
                    ? t('checkout.paymentSetupNote')
                    : t('checkout.payFrameNote')}
                </p>
                {payState === 'error' && (
                  <p className="mt-2 text-center text-xs text-bad">{t('checkout.payFailed')}</p>
                )}
                {/* Not an error, and deliberately not worded as one: the two
                    cases that land here are a payment the provider has not
                    confirmed to us yet and a window the customer simply closed.
                    Telling them apart from this side is not possible, so the
                    copy covers both and the cart is left where it was. */}
                {payState === 'unconfirmed' && (
                  <div
                    role="status"
                    className="mt-3 rounded-xl bg-gold-500/10 px-4 py-3 text-xs leading-5 text-gold-700 ring-1 ring-gold-500/20 dark:text-gold-300"
                  >
                    {t('checkout.unconfirmed')}
                    <Button
                      to="/account?tab=esims"
                      variant="ghost"
                      className="mt-2.5 min-h-11 w-full text-sm"
                    >
                      {t('checkout.goToMyEsims')}
                    </Button>
                    {/* Second, and quieter: most people who land here did pay
                        and want the first button. This one is for the other
                        case, and it is the only way out of a stale payment
                        link — see startOver. */}
                    <button
                      type="button"
                      onClick={() => void startOver()}
                      className="mt-2 min-h-11 w-full rounded-xl text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
                    >
                      {t('checkout.startOver')}
                    </button>
                  </div>
                )}
                {payState === 'cancelBlocked' && (
                  <p role="status" className="mt-2 text-center text-xs text-slate-soft">
                    {t('checkout.startOverBlocked')}
                  </p>
                )}
              </>
            ) : (
              <>
                <Button to="/login" state={{ from: '/checkout' }} fullWidth className="mt-5 py-3.5">
                  <LogIn size={18} />
                  {t('checkout.signInToPay')}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-soft">
                  <Lock size={12} /> {t('checkout.signInNote')}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

      {payUrl && (
        <PaymentFrame
          url={payUrl}
          onClose={() => void finishPayment()}
          returnFocus={payTrigger.current}
        />
      )}
    </div>
  )
}
