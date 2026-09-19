import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import './cart-bar.css'

/** Pages where a plan can be chosen — and so where the answer belongs. */
const BROWSING = [/^\/$/, /^\/destinations/, /^\/global/, /^\/marshrut/]

/**
 * "It went in the cart. Now what?"
 *
 * Shown when the cart gains something, on the pages where choosing happens,
 * and dismissed either by going to the cart or by saying "keep choosing". It
 * deliberately does not reappear on its own: a bar that comes back while
 * somebody is reading is a bar they learn to ignore.
 *
 * Not rendered on the checkout page for the obvious reason, and not on the
 * account pages, where the cart is not the subject.
 */
export default function CartBar() {
  const { items, count, subtotal } = useCart()
  const { formatPrice } = useCurrency()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const lastCount = useRef(count)

  useEffect(() => {
    // Opens on a gain, never on a removal — and never on first mount for a
    // cart restored from a previous visit.
    if (count > lastCount.current) setOpen(true)
    if (count === 0) setOpen(false)
    lastCount.current = count
  }, [count])

  // A new page is a new question; the previous answer stops applying.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const browsing = BROWSING.some((rule) => rule.test(pathname))
  if (!open || !browsing || items.length === 0) return null

  return (
    <div className="cart-bar" role="status">
      <span className="cart-bar__text">
        <span className="cart-bar__title">{t('cartbar.added')}</span>
        <span className="cart-bar__meta">
          {t('cartbar.count', { count })} · {formatPrice(subtotal)}
        </span>
      </span>
      <span className="cart-bar__actions">
        <button type="button" className="cart-bar__more" onClick={() => setOpen(false)}>
          {t('cartbar.more')}
        </button>
        <button
          type="button"
          className="cart-bar__go"
          onClick={() => {
            setOpen(false)
            navigate('/checkout')
          }}
        >
          <ShoppingBag size={16} aria-hidden="true" />
          {t('cartbar.go')}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </span>
    </div>
  )
}
