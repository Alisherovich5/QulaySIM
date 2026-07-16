import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  CreditCard,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Flag from '../components/Flag'
import { Button, Card } from '../components/ui'
import type { Order, Quote } from '../lib/types'

export default function Checkout() {
  const { items, setQuantity, remove, clear, subtotal } = useCart()
  const { customer } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [promo, setPromo] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)

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

  const pay = async () => {
    if (!customer) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    setPaying(true)
    try {
      const { data } = await api.post<Order>('/checkout', payload())
      setOrder(data)
      clear()
    } catch {
      setPromoError(t('checkout.payFailed'))
    } finally {
      setPaying(false)
    }
  }

  // Success screen
  if (order) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-500/10 text-accent-600">
            <BadgeCheck size={34} />
          </span>
          <h1 className="mt-5 text-3xl font-700">{t('checkout.successTitle')}</h1>
          <p className="mt-2 text-slate-soft">
            {t('checkout.successSubtitle', { id: order.id, count: order.esims.length })}
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl gap-4">
          {order.esims.map((e) => (
            <Card key={e.id} className="flex items-center gap-5 p-5">
              <img src={e.qr_image} alt="QR" className="h-28 w-28 rounded-lg ring-1 ring-line" />
              <div>
                <p className="font-600">{e.plan.title}</p>
                <p className="mt-1 font-mono text-xs text-slate-soft">ICCID {e.iccid}</p>
                <p className="mt-2 text-sm text-slate-soft">{t('checkout.installHint')}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/account" className="px-6 py-3">
            {t('checkout.goToMyEsims')}
          </Button>
          <Button to="/destinations" variant="ghost" className="px-6 py-3">
            {t('checkout.keepShopping')}
          </Button>
        </div>
      </div>
    )
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
    <div className="container-page py-12">
      <h1 className="text-3xl font-700">{t('checkout.title')}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.plan.id} className="card flex items-center gap-4 p-4">
              <Flag
                iso2={item.iso2}
                alt={item.countryName}
                className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-line"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-600">{item.plan.title}</p>
                <p className="text-sm text-slate-soft">
                  {item.countryName} · {item.plan.network_type} · {item.plan.validity_days} days
                </p>
              </div>
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
              <p className="w-16 text-right font-700">
                ${(item.plan.price_usd * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => remove(item.plan.id)}
                className="grid h-8 w-8 place-items-center text-slate-soft hover:text-red-500"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="p-6">
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
                <dd className="font-600">${(quote?.subtotal ?? subtotal).toFixed(2)}</dd>
              </div>
              {quote && quote.discount > 0 && (
                <div className="flex justify-between text-accent-600">
                  <dt>{t('checkout.discount')}</dt>
                  <dd className="font-600">−${quote.discount.toFixed(2)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-700">{t('checkout.total')}</dt>
                <dd className="font-display text-xl font-700">
                  ${(quote?.total ?? subtotal).toFixed(2)}
                </dd>
              </div>
            </dl>

            <Button onClick={pay} loading={paying} sheen fullWidth className="mt-5 py-3.5">
              {!paying && <CreditCard size={18} />}
              {paying
                ? t('checkout.processing')
                : customer
                  ? t('checkout.payNow')
                  : t('checkout.signInToPay')}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-soft">
              <Lock size={12} /> {t('checkout.mockNote')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
