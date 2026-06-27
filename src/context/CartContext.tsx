import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Plan } from '../lib/types'

interface CartState {
  items: CartItem[]
  add: (plan: Plan, countryName: string, iso2: string) => void
  remove: (planId: number) => void
  setQuantity: (planId: number, quantity: number) => void
  clear: () => void
  count: number
  subtotal: number
}

const CartContext = createContext<CartState | undefined>(undefined)
const STORAGE_KEY = 'fastsim_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = (plan: Plan, countryName: string, iso2: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.plan.id === plan.id)
      if (existing) {
        return prev.map((i) =>
          i.plan.id === plan.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...prev, { plan, countryName, iso2, quantity: 1 }]
    })
  }

  const remove = (planId: number) =>
    setItems((prev) => prev.filter((i) => i.plan.id !== planId))

  const setQuantity = (planId: number, quantity: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.plan.id === planId ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    )

  const clear = () => setItems([])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.plan.price_usd * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, add, remove, setQuantity, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
