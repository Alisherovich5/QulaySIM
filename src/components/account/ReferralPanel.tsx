import { useEffect, useState } from 'react'
import { Check, Copy, Users, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { ReferralEntry, ReferralSummary } from '../../lib/types'
import { Badge, Button, Card } from '../ui'

/** Havola orqali kelganlar va ular uchun tegishli pul.
 *
 *  Sahifaning tartibi savolning tartibi bilan bir xil: agent avval "qancha
 *  pul?" deb qaraydi, keyin "kimlar keldi?" deydi, havolani esa allaqachon
 *  tarqatgan bo'ladi. Shuning uchun pul yuqorida, havola o'rtada, ro'yxat
 *  pastda.
 */
export default function ReferralPanel() {
  const { t } = useTranslation()
  const [data, setData] = useState<ReferralSummary | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    api.get<ReferralSummary>('/account/referrals').then((r) => setData(r.data))
  }, [])

  if (!data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-line/50" />
  }

  const link = `${window.location.origin}/register?ref=${data.code}`
  const copy = (value: string, which: 'code' | 'link') => {
    navigator.clipboard?.writeText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="space-y-5">
      {/* --- Pul: sahifaning javobi --- */}
      <Card className="p-6">
        <p className="text-sm text-slate-soft">{t('referral.earnedLabel')}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-800 tracking-tight text-ink">
            {formatSom(data.earned_uzs)}
          </span>
          <span className="text-lg font-600 text-slate-soft">{t('referral.som')}</span>
        </p>
        <p className="mt-2 text-sm text-slate-soft">
          {t('referral.earnedHint', {
            count: data.completed,
            rate: formatSom(data.commission_uzs),
          })}
        </p>

        {/* Ikkita son alohida: pul faqat ikkinchisidan keladi. Bitta songa
            qo'shib qo'yilsa, agent birinchisiga qarab hisoblab, keyin nizo
            chiqadi. */}
        <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <Figure
            icon={<Users size={18} className="text-brand-500" />}
            value={data.invited}
            label={t('referral.invitedLabel')}
            hint={t('referral.invitedHint')}
          />
          <Figure
            icon={<Wallet size={18} className="text-accent-500" />}
            value={data.completed}
            label={t('referral.boughtLabel')}
            hint={t('referral.boughtHint')}
          />
        </div>
      </Card>

      {/* --- Havola: tarqatiladigan narsa --- */}
      <Card className="p-6">
        <h3 className="font-700">{t('referral.shareTitle')}</h3>
        <p className="mt-1 text-sm text-slate-soft">{t('referral.shareHint')}</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 truncate rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink">
            {link}
          </code>
          <Button className="shrink-0 px-4 py-3" onClick={() => copy(link, 'link')}>
            {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
            <span className="ml-2">
              {copied === 'link' ? t('referral.copied') : t('referral.copyLink')}
            </span>
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-soft">
          <span>{t('referral.orCode')}</span>
          <button
            type="button"
            onClick={() => copy(data.code, 'code')}
            className="rounded-lg border border-line px-2.5 py-1 font-mono font-700 text-ink hover:bg-surface-2"
          >
            {copied === 'code' ? t('referral.copied') : data.code}
          </button>
        </div>
      </Card>

      {/* --- Kimlar keldi --- */}
      <Card className="p-6">
        <h3 className="font-700">{t('referral.peopleTitle')}</h3>
        {data.entries.length === 0 ? (
          <p className="mt-3 text-sm text-slate-soft">{t('referral.none')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.entries.map((entry, index) => (
              <PersonRow key={index} entry={entry} />
            ))}
          </ul>
        )}
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
    </div>
  )
}

function Figure({
  icon,
  value,
  label,
  hint,
}: {
  icon: React.ReactNode
  value: number
  label: string
  hint: string
}) {
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-2xl font-800 tabular-nums text-ink">{value}</span>
      </div>
      <p className="mt-1 font-600 text-ink">{label}</p>
      <p className="mt-0.5 text-sm text-slate-soft">{hint}</p>
    </div>
  )
}

function PersonRow({ entry }: { entry: ReferralEntry }) {
  const { t } = useTranslation()
  const bought = entry.status === 'completed'
  // Ism bo'sh bo'lishi mumkin: taklif yuborilgan, hali qabul qilinmagan.
  const who = entry.referred_name?.trim() || entry.referred_email

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-600 text-ink">{who}</p>
        <p className="truncate text-sm text-slate-soft">
          {entry.referred_name?.trim() ? entry.referred_email : t('referral.waiting')}
        </p>
      </div>
      <Badge tone={bought ? 'accent' : 'muted'}>
        {bought ? t('referral.statusBought') : t('referral.statusJoined')}
      </Badge>
    </li>
  )
}

/** 12000 -> "12 000". Bo'shliq bilan, chunki so'm summalari uzun bo'ladi va
 *  ajratmasdan o'qib bo'lmaydi. */
function formatSom(value: number): string {
  return new Intl.NumberFormat('uz-UZ').format(value).replace(/,/g, ' ')
}
