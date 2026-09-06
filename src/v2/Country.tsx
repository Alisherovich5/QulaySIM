import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useCurrency } from '../context/CurrencyContext'
import type { CountryDetail, Plan } from '../lib/types'
import { Shell } from './Shell'
import { chooseForTrip, effectiveDays, explainAllowance } from './lib/recommend'
import { hours, perDayUzs, som, totalUzs } from './lib/money'

/**
 * Davlat sahifasi -- pul shu yerda ishlanadi, shuning uchun eng ko'p
 * o'zgargan joy ham shu.
 *
 * Hozir bu sahifada o'nta bir xil yashil "Savatga qo'shish" tugmasi bor,
 * ikkita "3 GB" yonma-yon turadi (46 999 va 49 999 so'm, farqi kichkina
 * kulrang qatorda), va o'rtasiga 200 999 so'mlik global "3 GB" suqilgan.
 * Odam tarif tanlashi uchun avval matematika qilishi kerak.
 *
 * Yangi tartib: bitta savol (necha kun), bitta javob (mos tarif), va yonida
 * "kamroq / ko'proq". Qolgan tariflar yashirilmaydi -- pastda, ochiladigan
 * ro'yxatda turadi, chunki yashirish ham bir xil darajada noqulay.
 */
export default function V2Country() {
  const { slug = '' } = useParams()
  const { usdToUzs } = useCurrency()
  const [data, setData] = useState<CountryDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const [days, setDays] = useState(7)
  const [showAll, setShowAll] = useState(false)
  const [picked, setPicked] = useState<Plan | null>(null)
  const [other, setOther] = useState(false)

  useEffect(() => {
    setData(null)
    setFailed(false)
    api
      .get<CountryDetail>(`/countries/${slug}`)
      .then((r) => setData(r.data))
      .catch(() => setFailed(true))
  }, [slug])

  const choice = useMemo(
    () => (data ? chooseForTrip(data.plans, days) : null),
    [data, days],
  )

  // Foydalanuvchi "kamroq/ko'proq" bosgan bo'lsa o'shani, aks holda tavsiyani.
  const plan = picked ?? choice?.best ?? null
  const allowance = plan ? explainAllowance(plan, days) : null

  if (failed) {
    return (
      <Shell back={{ to: '/yangi', label: 'Orqaga' }}>
        <div style={{ padding: 24 }}>
          <p>Bu davlat ochilmadi. Internetni tekshirib, qaytadan urinib ko‘ring.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell back={{ to: '/yangi', label: 'Orqaga' }}>
      <div style={{ padding: '24px 18px 48px', maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--v-t-title)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          {data ? data.name : '…'}
        </h1>

        {/* Bitta savol. Kun -- odam biladigan yagona son; GB emas. */}
        <section style={{ marginTop: 22 }}>
          <label htmlFor="v2-days" style={{ fontSize: 'var(--v-t-lead)', fontWeight: 650 }}>
            Necha kunga borasiz?
          </label>
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {[3, 5, 7, 10, 14, 30].map((d) => {
              const on = d === days
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDays(d)
                    setPicked(null)
                    setOther(false)
                  }}
                  className="v-tnum"
                  style={{
                    minHeight: 'var(--v-tap)',
                    borderRadius: 'var(--v-radius-sm)',
                    border: `1.5px solid ${on ? 'var(--v-brand)' : 'var(--v-line-strong)'}`,
                    background: on ? 'var(--v-brand-wash)' : 'var(--v-card)',
                    color: on ? 'var(--v-brand-ink)' : 'var(--v-ink)',
                    font: 'inherit',
                    fontWeight: on ? 750 : 550,
                    cursor: 'pointer',
                  }}
                >
                  {d} kun
                </button>
              )
            })}
          </div>

          {/* Ro'yxatda yo'q muddat uchun. Doim ochiq turganda u nima uchunligi
              tushunarsiz bo'sh katak bo'lib qolardi. */}
          {other ? (
            <input
              id="v2-days"
              className="v-field"
              style={{ marginTop: 10 }}
              type="number"
              min={1}
              max={365}
              value={days}
              autoFocus
              onChange={(e) => {
                setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))
                setPicked(null)
              }}
              aria-label="Safar necha kun"
            />
          ) : (
            <button
              type="button"
              className="v-quiet"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() => setOther(true)}
            >
              Boshqa muddat
            </button>
          )}
        </section>

        {/* Bitta javob. */}
        {plan && choice && (
          <section className="v-card" style={{ marginTop: 22, padding: 20 }}>
            <p className="v-muted">Sizga shu to‘g‘ri keladi</p>

            <p style={{ marginTop: 6, fontSize: 'var(--v-t-title)', fontWeight: 800 }}>
              {plan.is_unlimited ? 'Cheksiz internet' : plan.data_label}
              <span className="v-muted" style={{ fontWeight: 500 }}>
                {' '}· {plan.validity_days} kun
              </span>
            </p>

            {/* Katta raqam -- KUNLIK narx. Odam "kuniga qancha" ni bir qarashda
                tushunadi; "46 999 / 15 kun / 3 GB" esa hisob-kitob talab
                qiladi. Jami tagida, kichikroq, lekin yashirilmagan. */}
            <p style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="v-tnum" style={{ fontSize: 'var(--v-t-figure)', fontWeight: 800, letterSpacing: '-0.03em' }}>
                ~{som(perDayUzs(totalUzs(plan.price_usd, usdToUzs), effectiveDays(plan, days)))}
              </span>
              <span className="v-muted" style={{ fontSize: 'var(--v-t-lead)' }}>so‘m kuniga</span>
            </p>
            {/* Jami -- aniq, undiriladigan summa. Kunlik esa undan bo'lingan
                taxminiy son, shuning uchun oldida "~" turadi. */}
            <p className="v-muted v-tnum" style={{ marginTop: 2 }}>
              Jami {som(totalUzs(plan.price_usd, usdToUzs))} so‘m · {effectiveDays(plan, days)} kunga
            </p>

            {/* "Yetadimi?" -- eng ko'p beriladigan savol, hozirgi saytda javobi
                yo'q. GB odamga hech narsa demaydi. */}
            {allowance && (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 'var(--v-radius-sm)',
                  background: 'var(--v-sunk)',
                }}
              >
                <p style={{ fontWeight: 650 }}>Bu nimaga yetadi?</p>
                <p className="v-muted" style={{ marginTop: 6 }}>
                  Kuniga {allowance.perDayMb} MB — bu taxminan har kuni{' '}
                  {allowance.lines
                    .map((l) =>
                      l.kind === 'chat'
                        ? 'cheksiz yozishmalar'
                        : l.kind === 'map'
                          ? `${hours(l.hours)} soat xarita`
                          : `${hours(l.hours)} soat Instagram/TikTok`,
                    )
                    .join(', ')}
                  .
                </p>
              </div>
            )}

            {!choice.covers && (
              <p style={{ marginTop: 14, color: 'var(--v-brand-ink)', fontWeight: 600 }}>
                Bu davlatda {days} kunga to‘liq yetadigan tarif yo‘q — eng kattasi shu.
              </p>
            )}

            <button className="v-go" style={{ marginTop: 18, width: '100%' }} type="button">
              Sotib olish
            </button>

            {/* Yagona yashil tugma yuqorida. Bular -- jim variantlar. */}
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              {choice.cheaper && (
                <button
                  type="button"
                  className="v-quiet"
                  style={{ flex: 1, whiteSpace: 'nowrap', paddingInline: 12 }}
                  onClick={() => setPicked(choice.cheaper)}
                >
                  Kamroq · {label(choice.cheaper)}
                </button>
              )}
              {choice.dearer && (
                <button
                  type="button"
                  className="v-quiet"
                  style={{ flex: 1, whiteSpace: 'nowrap', paddingInline: 12 }}
                  onClick={() => setPicked(choice.dearer)}
                >
                  Ko‘proq · {label(choice.dearer)}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Qolganlari yashirilmaydi -- yig'ilgan holda turadi. */}
        {data && data.plans.length > 1 && (
          <section style={{ marginTop: 18 }}>
            <button
              type="button"
              className="v-quiet"
              style={{ width: '100%' }}
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
            >
              {showAll ? 'Yopish' : `Barcha ${data.plans.length} ta tarif`}
            </button>

            {showAll && (
              <table
                className="v-card v-tnum"
                style={{ marginTop: 12, width: '100%', borderCollapse: 'collapse', overflow: 'hidden' }}
              >
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 650 }}>Hajm</th>
                    <th style={{ padding: '12px 14px', fontWeight: 650 }}>Muddat</th>
                    <th style={{ padding: '12px 14px', fontWeight: 650, textAlign: 'right' }}>Narx</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans
                    .filter((p) => p.price_usd > 0)
                    .map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--v-line)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          {p.is_unlimited ? 'Cheksiz' : p.data_label}
                        </td>
                        <td style={{ padding: '12px 14px' }} className="v-muted">
                          {p.validity_days} kun
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 650 }}>
                          {som(totalUzs(p.price_usd, usdToUzs))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </Shell>
  )
}

/** Tugmadagi qisqa nom. Cheksiz tarifda "0 GB" deb yozilmasligi uchun. */
function label(plan: Plan): string {
  return plan.is_unlimited ? 'Cheksiz' : plan.data_label
}
