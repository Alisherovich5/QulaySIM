import { useEffect, useState } from 'react'
import { Check, Copy, Send, Users, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { ReferralEntry, ReferralSummary } from '../../lib/types'
import { Badge, Button, Card } from '../ui'

/** Odam yozadigan joy, kanal emas: pulni yechish — suhbat, e'lon emas. */
const SUPPORT_URL = 'https://t.me/qulaysim_support'

/** Havola orqali kelganlar va ular uchun tegishli pul.
 *
 *  Sahifaning ikkita holati bor va ular ataylab boshqacha ko'rinadi. Hali hech
 *  kim kirmaganda nol raqamlarni ko'rsatish — bo'sh jadval ko'rsatish bilan
 *  barobar: u hech narsa o'rgatmaydi va ishni boshlashga undamaydi. Shuning
 *  uchun bosh holatda raqamlar umuman chizilmaydi, o'rniga nima qilish
 *  kerakligi yoziladi.
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

  const started = data.invited > 0

  return (
    <div className="space-y-5">
      {started ? (
        <EarningsCard data={data} />
      ) : (
        <StartCard rate={formatSom(data.commission_uzs)} />
      )}

      <ShareCard
        link={link}
        code={data.code}
        copied={copied}
        onCopy={copy}
        highlight={!started}
      />

      {started && <PeopleCard entries={data.entries} />}

      <WithdrawCard earned={data.earned_uzs} />

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

/** Hali hech kim kirmagan holat: raqam emas, yo'riqnoma. */
function StartCard({ rate }: { rate: string }) {
  const { t } = useTranslation()
  const steps = [t('referral.step1'), t('referral.step2'), t('referral.step3', { rate })]

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-800 tracking-tight text-ink">{t('referral.startTitle')}</h2>
      <p className="mt-2 text-slate-soft">{t('referral.startSubtitle', { rate })}</p>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-500/10 font-700 text-brand-600">
              {index + 1}
            </span>
            <span className="text-ink">{step}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** Kimdir kirgan holat: pul birinchi, keyin ikkita son. */
function EarningsCard({ data }: { data: ReferralSummary }) {
  const { t } = useTranslation()
  const bought = data.completed

  return (
    <Card className="p-6">
      <p className="text-sm text-slate-soft">{t('referral.earnedLabel')}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-4xl font-800 tracking-tight text-ink">
          {formatSom(data.earned_uzs)}
        </span>
        <span className="text-lg font-600 text-slate-soft">{t('referral.som')}</span>
      </p>
      <p className="mt-2 text-sm text-slate-soft">
        {bought > 0
          ? t('referral.earnedHint', { count: bought, rate: formatSom(data.commission_uzs) })
          : t('referral.notYetBought', { rate: formatSom(data.commission_uzs) })}
      </p>

      {/* Ikkita son alohida: pul faqat ikkinchisidan keladi. */}
      <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
        <Figure
          icon={<Users size={18} className="text-brand-500" />}
          value={data.invited}
          label={t('referral.invitedLabel')}
          hint={t('referral.invitedHint')}
        />
        <Figure
          icon={<Wallet size={18} className="text-accent-500" />}
          value={bought}
          label={t('referral.boughtLabel')}
          hint={t('referral.boughtHint')}
        />
      </div>
    </Card>
  )
}

function ShareCard({
  link,
  code,
  copied,
  onCopy,
  highlight,
}: {
  link: string
  code: string
  copied: 'code' | 'link' | null
  onCopy: (value: string, which: 'code' | 'link') => void
  highlight: boolean
}) {
  const { t } = useTranslation()
  return (
    <Card className={highlight ? 'border-brand-500/40 p-6' : 'p-6'}>
      <h3 className="font-700">{t('referral.shareTitle')}</h3>
      <p className="mt-1 text-sm text-slate-soft">{t('referral.shareHint')}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <code className="flex-1 truncate rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink">
          {link}
        </code>
        <Button className="shrink-0 px-4 py-3" onClick={() => onCopy(link, 'link')}>
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
          onClick={() => onCopy(code, 'code')}
          className="rounded-lg border border-line px-2.5 py-1 font-mono font-700 text-ink hover:bg-surface-2"
        >
          {copied === 'code' ? t('referral.copied') : code}
        </button>
      </div>
    </Card>
  )
}

function PeopleCard({ entries }: { entries: ReferralEntry[] }) {
  const { t } = useTranslation()
  return (
    <Card className="p-6">
      <h3 className="font-700">{t('referral.peopleTitle')}</h3>
      <ul className="mt-4 divide-y divide-line">
        {entries.map((entry, index) => (
          <PersonRow key={index} entry={entry} />
        ))}
      </ul>
    </Card>
  )
}

/** Pulni yechish — har doim ko'rinadi.
 *
 *  Pul yig'ilgandan keyin qidirib qolmasligi uchun: qoidani oldindan bilgan
 *  odam keyin "endi nima qilaman?" deb so'ramaydi. Pul bo'lmaganda ham bir
 *  qatorlik izoh qoladi, tugma esa o'sha joyda turadi.
 */
function WithdrawCard({ earned }: { earned: number }) {
  const { t } = useTranslation()
  const hasMoney = earned > 0

  return (
    <Card className="p-6">
      <h3 className="font-700">{t('referral.withdrawTitle')}</h3>
      <p className="mt-1 text-sm text-slate-soft">
        {hasMoney
          ? t('referral.withdrawReady', { amount: formatSom(earned) })
          : t('referral.withdrawLater')}
      </p>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 font-700 ${
          hasMoney
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'border border-line text-ink hover:bg-surface-2'
        }`}
      >
        <Send size={16} />
        {t('referral.withdrawButton')}
      </a>
    </Card>
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
