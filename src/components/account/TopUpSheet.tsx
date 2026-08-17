import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../ui'

/**
 * Buying more data for an eSIM the customer already has.
 *
 * The situation this is for: somebody bought Turkey 1 GB, used it up mid-trip,
 * and wants another gigabyte on the same profile. Before this, the only answer
 * was to buy a second eSIM — a second QR to install, a second slot on a phone
 * that has four, and the first one left dead in the list.
 *
 * The options come from the wholesaler at the moment the sheet opens, because
 * that is the only way a top-up price exists: they quote per profile, not per
 * destination. So this cannot be prefetched or baked, and a slow supplier shows
 * as a loading line rather than an empty list pretending there is nothing.
 */

interface TopUp {
  package_code: string
  data_label: string
  data_mb: number
  validity_days: number
  price_usd: number
  price_uzs: number
}

interface Props {
  esimId: number
  onClose: () => void
  /** Called with the payment URL once the order exists. */
  onPay: (url: string) => void
}

export default function TopUpSheet({ esimId, onClose, onPay }: Props) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<TopUp[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .get<TopUp[]>(`/account/esims/${esimId}/topups`)
      .then((r) => {
        if (alive) setOptions(r.data)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [esimId])

  const buy = (code: string) => {
    setBuying(code)
    setError('')
    api
      .post<{ payment_url: string }>('/checkout/topup', { esim_id: esimId, package_code: code })
      .then((r) => onPay(r.data.payment_url))
      .catch((err: unknown) => {
        // The most likely refusal is a package the wholesaler has withdrawn
        // since the list was drawn, which is worth saying rather than hiding.
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setError(detail || t('topup.failed'))
        setBuying(null)
      })
  }

  const som = (value: number) =>
    new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(value)

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-ink/45 backdrop-blur-sm sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('topup.title')}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl ring-1 ring-line sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <h3 className="font-display text-base font-700">{t('topup.title')}</h3>
            <p className="mt-0.5 text-xs text-slate-soft">{t('topup.lead')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-soft hover:bg-mist hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {options === null && !failed && (
            <p className="px-2 py-6 text-center text-sm text-slate-soft">{t('topup.loading')}</p>
          )}
          {failed && (
            <p className="px-2 py-6 text-center text-sm text-slate-soft">{t('topup.unavailable')}</p>
          )}
          {options?.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-slate-soft">{t('topup.none')}</p>
          )}

          <ul className="grid gap-2">
            {options?.map((option) => (
              <li key={option.package_code}>
                <button
                  type="button"
                  disabled={buying !== null}
                  onClick={() => buy(option.package_code)}
                  className="focus-ring flex w-full items-center gap-3 rounded-xl bg-mist px-4 py-3 text-left ring-1 ring-line transition hover:ring-brand-300 disabled:opacity-60"
                >
                  <span className="font-display text-xl font-700 tabular-nums text-ink">
                    +{option.data_label}
                  </span>
                  <span className="text-xs text-slate-soft">
                    {t('topup.days', { count: option.validity_days })}
                  </span>
                  <span className="ml-auto text-right">
                    <span className="block font-700 tabular-nums text-ink">
                      {som(option.price_uzs)} <span className="text-xs font-600">{t('common.som')}</span>
                    </span>
                    {buying === option.package_code && (
                      <span className="block text-[11px] text-slate-soft">{t('topup.opening')}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {error && <p className="mt-3 px-2 text-sm text-status-bad-ink">{error}</p>}
        </div>

        <p className="border-t border-line px-5 py-3 text-[11px] leading-4 text-slate-soft">
          {t('topup.note')}
        </p>
      </div>
    </div>
  )
}

/** The button that opens the sheet, kept next to it so the pair stays one idea. */
export function TopUpButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <Button variant="ghost" onClick={onClick} className="min-h-11 px-4 py-2 text-sm">
      <Plus size={15} /> {t('topup.button')}
    </Button>
  )
}
