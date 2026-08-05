import { useEffect, useState } from 'react'
import { PriceTag } from '../components/ui'
import {
  CreditCard,
  Lock,
  LogIn,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import Seo from '../components/Seo'
import PaymentFrame from '../components/PaymentFrame'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import Flag from '../components/Flag'
import { Button, Card } from '../components/ui'
import type { Quote } from '../lib/types'

export default function Checkout() {
  const { items, setQuantity, remove, subtotal } = useCart()
  const { customer } = useAuth()
  const { t } = useTranslation()
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [payState, setPayState] = useState<'idle' | 'starting' | 'error' | 'unavailable'>('idle')

  /**
   * Ask the API to place the order and hand back a payment URL.
   *
   * The order is created server-side from the server's own prices — the cart in
   * this browser is a suggestion, not an authority — and the URL that comes
   * back belongs to whichever provider is configured. A 503 means no provider
   * is live yet, which is a different message from a failure.
   */
  const startPayment = async () => {
    setPayState('starting')
    try {
      const { data } = await api.post<{ payment_url: string }>('/checkout', {
        items: items.map((i) => ({ plan_id: i.plan.id, quantity: i.quantity })),
        promo_code: appliedPromo || undefined,
      })
      setPayUrl(data.payment_url)
      setPayState('idle')
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      setPayState(status === 503 ? 'unavailable' : 'error')
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
        setPromoError(data.promo_message || 'Invalid promo code')
        setAppliedPromo(null)
      }
    } catch {
      setPromoError(t('checkout.payFailed'))
    }
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="container-page py-20">
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
    <div className="container-page py-8 sm:py-12">
      <Seo title={t('seo.checkoutTitle')} description={t('seo.homeDescription')} noindex />
      <h1 className="text-2xl font-700 sm:text-3xl">{t('checkout.title')}</h1>
      {priceChanged && (
        <p className="mt-3 rounded-xl bg-gold-500/10 px-4 py-3 text-sm text-gold-700 ring-1 ring-gold-500/20 dark:text-gold-300">
          {t('checkout.priceUpdated')}
        </p>
      )}
      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.plan.id} className="card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:flex sm:gap-4">
              <Flag
                iso2={item.iso2}
                alt={item.countryName}
                className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-line"
              />
              <div className="min-w-0">
                <p className="truncate font-600">{item.plan.title}</p>
                <p className="text-sm text-slate-soft">
                  {item.countryName} · {item.plan.network_type} · {item.plan.validity_days} days
                </p>
              </div>
              <div className="col-span-3 flex items-center justify-between gap-3 border-t border-line pt-3 sm:ml-auto sm:border-0 sm:pt-0">
                <div className="flex items-center gap-1 rounded-lg ring-1 ring-line">
                <button
                  onClick={() => setQuantity(item.plan.id, item.quantity - 1)}
                  className="grid h-8 w-8 place-items-center text-slate-soft hover:text-brand-600"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-600">{item.quantity}</span>
                <button
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
                aria-label="Remove"
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
              <label className="text-xs font-600 text-slate-soft">{t('checkout.promoCode')}</label>
              <div className="mt-1.5 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3 ring-1 ring-line">
                  <Tag size={15} className="text-slate-soft" />
                  <input
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
                  loading={payState === 'starting'}
                  disabled={payState === 'starting' || payState === 'unavailable'}
                  onClick={startPayment}
                >
                  <CreditCard size={18} />
                  {payState === 'unavailable'
                    ? t('checkout.paymentSetup')
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

      {payUrl && <PaymentFrame url={payUrl} onClose={() => setPayUrl(null)} />}
    </div>
  )
}
