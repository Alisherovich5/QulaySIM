import { CalendarClock, CircleDot, Power, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ESIM } from '../lib/types'
import { hasNotStarted } from '../lib/esim-progress'
import { formatClock, formatDate, usedLabel } from '../lib/format'
import { useCurrency } from '../context/CurrencyContext'
import { useDesignCopy } from '../lib/design-copy'
import { Button } from './ui'
import { TopUpButton } from './account/TopUpSheet'
/* Inline uslub: bu kartaning CSS fayli (src/design/redesign.css) hozir
   boshqa ishning ostida turgani uchun unga qator qo'shilmadi. Rang
   currentColor dan chiqadi, ya'ni yorug' va qorong'i temada ikkisida
   ham o'qiladi. */
const NOTE: React.CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 12,
  borderInlineStart: '3px solid currentColor',
  background: 'color-mix(in srgb, currentColor 7%, transparent)',
  fontSize: 15,
  lineHeight: 1.45,
}

/* Ogohlantirish: muddat o'rnatilgan kundan ketadi, ya'ni bu yerda pul yonadi. */
const NOTE_WARN: React.CSSProperties = {
  color: 'var(--color-status-warn-ink, #9E6D14)',
}

const NOTE_BODY: React.CSSProperties = { margin: '4px 0 0', opacity: 0.85 }

interface Props {
  esim: ESIM
  onActivate: (id: number) => void
  activating?: boolean
  onTopUp?: (id: number) => void
}
export default function EsimCard({ esim, onActivate, activating, onTopUp }: Props) {
  const { t, i18n } = useTranslation()
  const { currency, formatUsd } = useCurrency()
  const c = useDesignCopy()
  const total = esim.data_total_mb
  const unlimited = total === 0
  const pct = unlimited ? 0 : Math.min(100, Math.round((esim.data_used_mb / total) * 100))
  const statusLabel = t(
    `account.status${esim.status.charAt(0).toUpperCase()}${esim.status.slice(1)}`,
  )
  // Nega qat'iy nol emas -- sabab lib/esim-progress.ts da yozilgan.
  const notStarted = hasNotStarted(esim)
  const daysLeft = esim.expires_at
    ? Math.max(0, Math.ceil((new Date(esim.expires_at).getTime() - Date.now()) / 86400000))
    : null
  const paid =
    currency === 'UZS' && esim.paid_uzs != null && Number.isFinite(Number(esim.paid_uzs))
      ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }).format(
          Number(esim.paid_uzs),
        ) +
        ' ' +
        t('account.som')
      : esim.paid_usd != null && Number.isFinite(Number(esim.paid_usd))
        ? formatUsd(Number(esim.paid_usd))
        : null
  return (
    <article className="esim-card">
      <div className="esim-card-header">
        <h3>{esim.plan.title}</h3>
        <span className="esim-status" data-status={esim.status}>
          <span />
          {statusLabel}
        </span>
      </div>
      <div className="esim-card-body">
        <div className="esim-qr">
          {esim.qr_image ? (
            <img src={esim.qr_image} alt="eSIM QR code" width="180" height="180" />
          ) : (
            <div className="qr-pending">
              <CircleDot size={24} />
              <p>{t('account.qrPending')}</p>
            </div>
          )}
          <Link to="/esim-ornatish">
            {c.howLink}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="esim-details">
          <p>{t('account.dataLeft')}</p>
          <strong>
            {unlimited ? t('account.unlimited') : usedLabel(Math.max(0, total - esim.data_used_mb))}
          </strong>
          {!unlimited && (
            <>
              <div className="esim-meter">
                <span style={{ width: pct + '%' }} />
              </div>
              <p className="esim-usage">
                {t('account.ofTotalUsed', {
                  used: usedLabel(esim.data_used_mb),
                  total: usedLabel(total),
                })}
                {/* Raqam yonida qachon so'ralgani. Yolg'iz turgan "0 MB"
                    buzuq raqamdek o'qiladi; vaqt bilan birga -- javob. */}
                {' · '}
                <span style={{ opacity: 0.75 }}>
                  {esim.last_synced_at
                    ? t('esim.checkedAt', {
                        time: formatClock(esim.last_synced_at, i18n.language),
                      })
                    : t('esim.checkedNever')}
                </span>
              </p>
            </>
          )}

          {/* 3-band: nol sarfni tushuntirish.
              Faqat ta'minotchi "ishlayapti" deb turganda chiqadi -- ya'ni
              eSIM tirik, lekin hali hech narsa sarflanmagan. Aynan shu
              holatda mijoz "sayt buzuq" deb yozadi. */}
          {notStarted && (
            <div style={NOTE}>
              <strong>{t('esim.notStartedTitle')}</strong>
              <p style={NOTE_BODY}>{t('esim.notStartedBody')}</p>
            </div>
          )}

          {/* 4-band: pul yonadigan joy. Muddat o'rnatilgan kundan ketadi,
              shuning uchun ogohlantirish hali o'rnatilmagan eSIMda, QR
              yonida turadi. */}
          {esim.status === 'pending' && (
            <div style={{ ...NOTE, ...NOTE_WARN }}>
              <strong>{t('esim.installWarnTitle')}</strong>
              <p style={NOTE_BODY}>{t('esim.installWarnBody')}</p>
            </div>
          )}
          <p className="esim-expiry">
            <CalendarClock size={16} />
            {daysLeft !== null && esim.status !== 'expired'
              ? t('account.daysLeft', { days: daysLeft })
              : t('account.expires', { date: formatDate(esim.expires_at, i18n.language) })}
          </p>
          <div className="esim-card-actions">
            {onTopUp && esim.status !== 'pending' && (
              <TopUpButton onClick={() => onTopUp(esim.id)} />
            )}{' '}
            {esim.status === 'pending' && (
              <Button type="button" onClick={() => onActivate(esim.id)} loading={activating}>
                {!activating && <Power size={16} />}{' '}
                {activating ? t('account.activating') : t('account.activate')}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="esim-card-footer">
        <span>ICCID {esim.iccid}</span>
        {paid && <span>{paid}</span>}
        <span>
          {t('account.purchasedOn', { date: formatDate(esim.created_at, i18n.language) })}
        </span>
      </div>
    </article>
  )
}
