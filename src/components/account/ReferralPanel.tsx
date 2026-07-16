import { useEffect, useState } from 'react'
import { Check, Copy, Gift, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { ReferralSummary } from '../../lib/types'
import { Badge, Button, Card, IconBadge } from '../ui'

export default function ReferralPanel() {
  const { t } = useTranslation()
  const [data, setData] = useState<ReferralSummary | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    api.get<ReferralSummary>('/account/referrals').then((r) => setData(r.data))
  }, [])

  if (!data) {
    return <div className="h-48 animate-pulse rounded-2xl bg-line/50" />
  }

  const link = `${window.location.origin}/register?ref=${data.code}`
  const copy = (value: string, which: 'code' | 'link') => {
    navigator.clipboard?.writeText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <IconBadge icon={Gift} tone="gold" size="lg" />
          <div>
            <h2 className="text-lg font-700">{t('referral.title')}</h2>
            <p className="mt-1 text-sm text-slate-soft">{t('referral.subtitle')}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-600 text-slate-soft">{t('referral.yourCode')}</label>
            <div className="mt-1.5 flex gap-2">
              <div className="flex flex-1 items-center rounded-xl bg-mist px-3 font-mono text-sm font-700 tracking-wider text-ink ring-1 ring-line">
                {data.code}
              </div>
              <Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => copy(data.code, 'code')}>
                {copied === 'code' ? <Check size={15} /> : <Copy size={15} />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-600 text-slate-soft">{t('referral.yourLink')}</label>
            <div className="mt-1.5 flex gap-2">
              <div className="flex flex-1 items-center truncate rounded-xl bg-mist px-3 text-sm text-slate-soft ring-1 ring-line">
                <span className="truncate">{link}</span>
              </div>
              <Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => copy(link, 'link')}>
                {copied === 'link' ? <Check size={15} /> : <Copy size={15} />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-6 border-t border-line pt-5">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-brand-500" />
            <span className="font-700">{data.invited}</span>
            <span className="text-sm text-slate-soft">{t('referral.invited')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={16} className="text-accent-500" />
            <span className="font-700">{data.completed}</span>
            <span className="text-sm text-slate-soft">{t('referral.completed')}</span>
          </div>
        </div>
      </Card>

      {data.rewards.length > 0 && (
        <Card className="p-6">
          <h3 className="font-700">{t('referral.rewards')}</h3>
          <p className="mt-1 text-sm text-slate-soft">{t('referral.rewardsHint')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.rewards.map((code) => (
              <span
                key={code}
                className="rounded-lg border border-dashed border-gold-500/50 bg-gold-500/10 px-3 py-1.5 font-mono text-sm font-700 text-gold-600"
              >
                {code}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-2">
        {data.entries.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-soft">{t('referral.none')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.entries.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate text-sm text-ink">{e.referred_email}</span>
                <Badge tone={e.status === 'completed' ? 'accent' : 'muted'}>
                  {e.status === 'completed'
                    ? t('referral.statusCompleted')
                    : t('referral.statusPending')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
