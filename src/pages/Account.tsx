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
    <div className="container-page py-10">
      <Reveal>
        <ProfileHeader summary={summary} onLogout={handleLogout} />
      </Reveal>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      <div className="mt-8 flex gap-1 overflow-x-auto rounded-xl bg-mist p-1 ring-1 ring-line">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-600 transition ${
              tab === tb.key
                ? 'bg-surface text-brand-600 shadow-sm'
                : 'text-slate-soft hover:text-ink'
            }`}
          >
            <tb.icon size={16} /> {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
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
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false) }}>
          <Card className="w-full max-w-sm p-6 shadow-2xl">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500"><AlertTriangle size={23} /></span>
            <h2 id="logout-title" className="mt-4 text-xl font-700">{t('account.logoutConfirmTitle')}</h2>
            <p className="mt-2 text-sm text-slate-soft">{t('account.logoutConfirmText')}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>{t('account.logoutCancel')}</Button>
              <Button onClick={confirmLogout} className="bg-red-500 hover:bg-red-600">{t('account.logoutConfirm')}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
