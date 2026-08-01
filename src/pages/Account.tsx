import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  DollarSign,
  Gift,
  Globe2,
  Map as MapIcon,
  MessageSquareText,
  Plus,
  QrCode,
  Receipt,
  RotateCw,
  SignalHigh,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { AccountSummary, ESIM, Order } from '../lib/types'
import EsimCard from '../components/EsimCard'
import Reveal from '../components/Reveal'
import { Button, Card } from '../components/ui'
import ProfileHeader from '../components/account/ProfileHeader'
import StatTile from '../components/account/StatTile'
import PassportCard from '../components/account/PassportCard'
import OrderRow from '../components/account/OrderRow'
import SettingsForm from '../components/account/SettingsForm'
import WorldMap from '../components/account/WorldMap'
import ReferralPanel from '../components/account/ReferralPanel'
import ReviewPanel from '../components/account/ReviewPanel'

type Tab = 'map' | 'esims' | 'orders' | 'review' | 'referral' | 'settings'

/** Small uppercase label that opens a band of the page. */
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-700 uppercase leading-none tracking-[0.12em] text-slate-soft">
      {children}
    </p>
  )
}

/**
 * Heading for a tab panel.
 *
 * The panels used to start straight into content, so nothing told you where
 * one section ended and the next began — the page had no rhythm below the
 * stats. A display heading, a quiet subtitle and an optional count give each
 * panel the same opening beat.
 */
function SectionHead({
  title,
  subtitle,
  count,
  action,
}: {
  title: string
  subtitle?: string
  count?: number
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-700 leading-tight tracking-[-0.015em] sm:text-xl">
            {title}
          </h2>
          {count !== undefined && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-700 tabular-nums text-slate-soft ring-1 ring-line">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-sm leading-snug text-slate-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export default function Account() {
  const { logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const [esims, setEsims] = useState<ESIM[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('map')
  const [activating, setActivating] = useState<number | null>(null)
  const [toppingUp, setToppingUp] = useState<number | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      api.get<AccountSummary>('/account/summary'),
      api.get<ESIM[]>('/account/esims'),
      api.get<Order[]>('/account/orders'),
    ])
      .then(([s, e, o]) => {
        setSummary(s.data)
        setEsims(e.data)
        setOrders(o.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleLogout = () => setShowLogoutConfirm(true)

  const confirmLogout = () => {
    logout()
    navigate('/')
  }

  const activate = async (id: number) => {
    setActivating(id)
    try {
      const { data } = await api.post<ESIM>(`/account/esims/${id}/activate`)
      setEsims((prev) => prev.map((e) => (e.id === id ? data : e)))
      const s = await api.get<AccountSummary>('/account/summary')
      setSummary(s.data)
    } finally {
      setActivating(null)
    }
  }

  const topup = async (id: number) => {
    setToppingUp(id)
    try {
      const { data } = await api.post<ESIM>(`/account/esims/${id}/topup`, { extra_mb: 1024 })
      setEsims((prev) => prev.map((e) => (e.id === id ? data : e)))
    } finally {
      setToppingUp(null)
    }
  }

  if (loading) {
    /* Shaped like the page it precedes — header, four tiles, rail, panel —
       so the layout does not jump when the data lands. */
    return (
      <div className="container-page py-6 sm:py-10" aria-busy="true">
        <div className="h-56 animate-pulse rounded-2xl bg-line/50 sm:h-60" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-line/50" />
          ))}
        </div>
        <div className="mt-7 h-14 animate-pulse rounded-2xl bg-line/50 sm:mt-9" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-line/50" />
        <span className="sr-only">{t('account.loading')}</span>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-500/10 text-red-500 ring-1 ring-red-500/15">
            <AlertTriangle size={26} />
          </span>
          <h1 className="mt-4 font-display text-xl font-700">{t('account.errorTitle')}</h1>
          <p className="mt-2 text-slate-soft">{t('account.errorSubtitle')}</p>
          <Button onClick={load} className="focus-ring mx-auto mt-5 w-fit px-6 py-3">
            <RotateCw size={16} /> {t('account.retry')}
          </Button>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof QrCode }[] = [
    { key: 'map', label: t('account.tabMap'), icon: MapIcon },
    { key: 'esims', label: t('account.tabEsims'), icon: QrCode },
    { key: 'orders', label: t('account.tabOrders'), icon: Receipt },
    { key: 'review', label: t('account.tabReview'), icon: MessageSquareText },
    { key: 'referral', label: t('referral.tab'), icon: Gift },
    { key: 'settings', label: t('account.tabSettings'), icon: SignalHigh },
  ]

  const hasQuota = summary.data_total_mb > 0
  const gbLeft = Math.max(0, (summary.data_total_mb - summary.data_used_mb) / 1024)

  return (
    <div className="container-page py-6 sm:py-10">
      <Reveal>
        <ProfileHeader summary={summary} onLogout={handleLogout} onSummaryChange={setSummary} />
      </Reveal>

      {/* Overview -------------------------------------------------------- */}
      <div className="mt-7 sm:mt-9">
        <Eyebrow>{t('account.overview')}</Eyebrow>
        <div className="mt-3 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
          <Reveal delay={0} className="h-full">
            <StatTile
              icon={SignalHigh}
              value={summary.active_esims}
              label={t('account.statActive')}
              tone="accent"
              live={summary.active_esims > 0}
            />
          </Reveal>
          <Reveal delay={60} className="h-full">
            <StatTile
              icon={QrCode}
              value={summary.data_used_mb / 1024}
              decimals={1}
              suffix=" GB"
              label={t('account.statData')}
              tone="brand"
              featured
              meter={
                hasQuota
                  ? {
                      ratio: summary.data_used_mb / summary.data_total_mb,
                      caption: t('account.statDataLeft', { gb: gbLeft.toFixed(1) }),
                    }
                  : undefined
              }
            />
          </Reveal>
          <Reveal delay={120} className="h-full">
            <StatTile
              icon={Globe2}
              value={summary.countries_connected}
              label={t('account.statCountries')}
              tone="violet"
            />
          </Reveal>
          <Reveal delay={180} className="h-full">
            <StatTile
              icon={DollarSign}
              value={summary.total_spent}
              decimals={2}
              prefix="$"
              label={t('account.statSpent')}
              tone="amber"
            />
          </Reveal>
        </div>
      </div>

      {/* Tabs ------------------------------------------------------------ */}
      {/* Labels are no longer clipped to a fixed 112px on a phone — the rail
          scrolls and each tab is as wide as its word. */}
      <div className="-mx-5 mt-7 px-5 sm:mx-0 sm:px-0 md:mt-9">
        {/* p-1.5 is load-bearing: the rail is a scroll container, so it clips
            its children — the 2px focus outline plus its 2px offset has to fit
            inside the padding or the first and last tab lose their ring. */}
        <div className="account-tab-rail flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain rounded-2xl bg-surface-2 p-1.5 ring-1 ring-line [scrollbar-width:none] dark:bg-canvas">
          {tabs.map((tb) => {
            const active = tab === tb.key
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                aria-pressed={active}
                className={`focus-ring flex min-h-11 shrink-0 snap-start items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-600 whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 md:min-w-0 md:flex-1 ${
                  active
                    ? 'elev-1 bg-surface text-brand-600 dark:bg-surface-2 dark:text-accent-400'
                    : 'text-slate-soft hover:text-ink'
                }`}
              >
                <tb.icon size={16} className="shrink-0" aria-hidden />
                <span className="md:truncate">{tb.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Panel ----------------------------------------------------------- */}
      <div key={tab} className="page-in mt-6 sm:mt-8">
        {tab === 'map' && (
          <div className="space-y-5 sm:space-y-6">
            <WorldMap passport={summary.passport} />
            <PassportCard passport={summary.passport} />
          </div>
        )}

        {tab === 'esims' && (
          <div>
            <SectionHead
              title={t('account.tabEsims')}
              subtitle={t('account.esimsSubtitle')}
              count={esims.length || undefined}
              action={
                esims.length > 0 ? (
                  <Button to="/destinations" variant="ghost" className="focus-ring min-h-11 py-0 text-sm">
                    <Plus size={16} /> {t('account.buyAnother')}
                  </Button>
                ) : undefined
              }
            />
            {esims.length === 0 ? (
              <Card className="elev-1 px-6 py-12 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/15 dark:text-brand-300">
                  <QrCode size={26} />
                </span>
                <h3 className="mt-4 font-display text-xl font-700">{t('account.emptyTitle')}</h3>
                <p className="mx-auto mt-2 max-w-sm text-slate-soft">{t('account.emptySubtitle')}</p>
                <Button to="/destinations" className="focus-ring mx-auto mt-5 w-fit px-6 py-3">
                  <Plus size={16} /> {t('account.buyAnother')}
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {esims.map((e, i) => (
                  <Reveal key={e.id} delay={i * 50}>
                    <EsimCard
                      esim={e}
                      onActivate={activate}
                      onTopup={topup}
                      activating={activating === e.id}
                      toppingUp={toppingUp === e.id}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <SectionHead
              title={t('account.tabOrders')}
              subtitle={t('account.ordersSubtitle')}
              count={orders.length || undefined}
            />
            {orders.length === 0 ? (
              <Card className="elev-1 px-6 py-12 text-center text-slate-soft">
                {t('account.noOrders')}
              </Card>
            ) : (
              /* One card with hairline dividers instead of five detached
                 boxes: an order history is a list, and reads as one. */
              <Reveal>
                <ul className="card elev-1 divide-y divide-line overflow-hidden">
                  {orders.map((o, i) => (
                    <OrderRow key={o.id} order={o} index={i} />
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        )}

        {tab === 'referral' && <ReferralPanel />}

        {tab === 'review' && <ReviewPanel />}

        {tab === 'settings' && (
          <SettingsForm initialName={summary.full_name} onSaved={load} onLogout={handleLogout} />
        )}
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-end bg-slate-950/60 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          aria-describedby="logout-description"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLogoutConfirm(false) }}
        >
          <Card className="logout-sheet motion-safe:animate-[fs-sheet-in_280ms_cubic-bezier(0.22,1,0.36,1)_both] w-full rounded-b-none rounded-t-[1.75rem] border-x-0 border-b-0 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-3xl sm:border sm:p-6">
            <span aria-hidden className="mx-auto mb-5 block h-1.5 w-11 rounded-full bg-line sm:hidden" />
            <div className="flex items-start gap-3 sm:block">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/15 sm:h-14 sm:w-14">
                <AlertTriangle size={24} />
              </span>
              <div>
                <h2 id="logout-title" className="text-xl font-700 sm:mt-4">{t('account.logoutConfirmTitle')}</h2>
                <p id="logout-description" className="mt-1.5 text-sm leading-6 text-slate-soft sm:mt-2">{t('account.logoutConfirmText')}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-row-reverse sm:justify-end">
              <Button onClick={confirmLogout} className="focus-ring min-h-12 w-full bg-red-500 px-5 hover:bg-red-600 sm:w-auto">
                {t('account.logoutConfirm')}
              </Button>
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} className="focus-ring min-h-12 w-full px-5 sm:w-auto">
                {t('account.logoutCancel')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
