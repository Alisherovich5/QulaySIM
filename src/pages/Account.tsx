import { useEffect, useState } from 'react'
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
    return (
      <div className="container-page py-10">
        <div className="h-44 animate-pulse rounded-2xl bg-line/50" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-line/50" />
          ))}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-line/50" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={26} />
          </span>
          <h1 className="mt-4 text-xl font-700">{t('account.errorTitle')}</h1>
          <p className="mt-2 text-slate-soft">{t('account.errorSubtitle')}</p>
          <Button onClick={load} className="mx-auto mt-5 w-fit px-6 py-3">
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

  return (
    <div className="container-page py-6 sm:py-10">
      <Reveal>
        <ProfileHeader summary={summary} onLogout={handleLogout} />
      </Reveal>

      {/* Stat tiles */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
        <Reveal delay={0}>
          <StatTile icon={SignalHigh} value={summary.active_esims} label={t('account.statActive')} tone="accent" />
        </Reveal>
        <Reveal delay={60}>
          <StatTile
            icon={QrCode}
            value={summary.data_used_mb / 1024}
            decimals={1}
            suffix=" GB"
            label={t('account.statData')}
            tone="brand"
          />
        </Reveal>
        <Reveal delay={120}>
          <StatTile icon={Globe2} value={summary.countries_connected} label={t('account.statCountries')} tone="violet" />
        </Reveal>
        <Reveal delay={180}>
          <StatTile icon={DollarSign} value={summary.total_spent} decimals={2} prefix="$" label={t('account.statSpent')} tone="amber" />
        </Reveal>
      </div>

      {/* Tabs */}
      <div className="account-tab-rail mt-3 -mx-5 flex snap-x gap-2 overflow-x-auto overscroll-x-contain px-5 pb-4 pt-4 [scrollbar-width:none] md:mt-7 md:mx-0 md:rounded-xl md:bg-mist md:p-1 md:ring-1 md:ring-line">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            aria-pressed={tab === tb.key}
            className={`flex min-w-[112px] snap-start items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-700 transition md:min-w-0 md:flex-1 md:rounded-lg md:text-sm md:font-600 ${
              tab === tb.key
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 md:bg-surface md:text-brand-600 md:shadow-sm'
                : 'bg-surface text-slate-soft ring-1 ring-line hover:text-ink md:bg-transparent md:ring-0'
            }`}
          >
            <tb.icon size={16} className="shrink-0" /> <span className="min-w-0 truncate">{tb.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 sm:mt-6">
        {tab === 'map' && (
          <div className="space-y-6">
            <WorldMap passport={summary.passport} />
            <PassportCard passport={summary.passport} />
          </div>
        )}

        {tab === 'esims' && (
          <div className="space-y-6">
            {esims.length === 0 ? (
              <Card className="p-12 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
                  <QrCode size={26} />
                </span>
                <h2 className="mt-4 text-xl font-700">{t('account.emptyTitle')}</h2>
                <p className="mt-2 text-slate-soft">{t('account.emptySubtitle')}</p>
                <Button to="/destinations" className="mx-auto mt-5 w-fit px-6 py-3">
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
          <div className="space-y-3">
            {orders.length === 0 ? (
              <Card className="p-12 text-center text-slate-soft">{t('account.noOrders')}</Card>
            ) : (
              orders.map((o, i) => (
                <Reveal key={o.id} delay={i * 40}>
                  <OrderRow order={o} />
                </Reveal>
              ))
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
              <Button onClick={confirmLogout} className="min-h-12 w-full bg-red-500 px-5 hover:bg-red-600 sm:w-auto">
                {t('account.logoutConfirm')}
              </Button>
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} className="min-h-12 w-full px-5 sm:w-auto">
                {t('account.logoutCancel')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
