import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import { charmUzs } from '../lib/charm'

export type Currency = 'USD' | 'UZS'

interface CurrencyState {
  currency: Currency
  setCurrency: (currency: Currency) => void
  /** Single string in the currently selected currency. */
  formatPrice: (usd: number | null | undefined) => string
  /** Both currencies, for the dual display used on price tags. */
  formatDual: (usd: number | null | undefined) => { primary: string; secondary: string }
  formatUzs: (usd: number | null | undefined) => string
  formatUsd: (usd: number | null | undefined) => string
  usdToUzs: number
  isRateFallback: boolean
}

interface CurrencyRateResponse {
  usd_to_uzs: number
  source: string
}

const STORAGE_KEY = 'qulaysim_currency'
const FALLBACK_USD_TO_UZS = 12000
const CurrencyContext = createContext<CurrencyState | undefined>(undefined)

function initialCurrency(): Currency {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'USD' ? 'USD' : 'UZS'
}

/**
 * Catalogue prices are kept in USD. This provider only changes how those
 * prices are displayed; checkout calculations remain based on the USD value.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency)
  const [usdToUzs, setUsdToUzs] = useState(FALLBACK_USD_TO_UZS)
  const [isRateFallback, setIsRateFallback] = useState(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency)
  }, [currency])

  useEffect(() => {
    api
      .get<CurrencyRateResponse>('/currency')
      .then(({ data }) => {
        if (Number.isFinite(data.usd_to_uzs) && data.usd_to_uzs > 0) {
          setUsdToUzs(data.usd_to_uzs)
          setIsRateFallback(data.source !== 'cbu')
        }
      })
      // The initial fallback keeps every price readable if the rate service is unavailable.
      .catch(() => undefined)
  }, [])

  const formatUsd = useCallback((usd: number | null | undefined) => {
    if (usd == null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
    }).format(usd)
  }, [])

  const formatUzs = useCallback(
    (usd: number | null | undefined) => {
      if (usd == null) return '—'
      return `${new Intl.NumberFormat('uz-UZ', {
        maximumFractionDigits: 0,
      }).format(charmUzs(usd * usdToUzs))} so‘m`
    },
    [usdToUzs],
  )

  const formatPrice = useCallback(
    (usd: number | null | undefined) =>
      currency === 'USD' ? formatUsd(usd) : formatUzs(usd),
    [currency, formatUsd, formatUzs],
  )

  /**
   * Both currencies at once. Customers pay in som but the catalogue is priced
   * in USD, so showing only one leaves someone converting in their head. The
   * selected currency leads; the other follows as an approximation.
   */
  const formatDual = useCallback(
    (usd: number | null | undefined) => {
      if (usd == null) return { primary: '—', secondary: '' }
      return currency === 'USD'
        ? { primary: formatUsd(usd), secondary: `≈ ${formatUzs(usd)}` }
        : { primary: formatUzs(usd), secondary: `≈ ${formatUsd(usd)}` }
    },
    [currency, formatUsd, formatUzs],
  )

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatPrice,
      formatDual,
      formatUsd,
      formatUzs,
      usdToUzs,
      isRateFallback,
    }),
    [currency, formatDual, formatPrice, formatUsd, formatUzs, isRateFallback, usdToUzs],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used inside CurrencyProvider')
  return context
}
