import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroGlobe, { type HeroGlobePick } from '../components/home/HeroGlobe'
import { api } from '../lib/api'
import type { Country } from '../lib/types'
import { Shell } from './Shell'

/**
 * Bosh sahifa: bitta savol.
 *
 * Hozirgi bosh sahifa olti ekran va u muammoni tushuntirish bilan boshlanadi
 * ("Ko'plab sayohatchilar duch keladigan internet muammosiga..."). Saytga
 * kirgan odam muammoni allaqachon biladi -- u shu yerda bo'lishining sababi
 * shu. Uning javob kutayotgan savoli bitta: QAYERGA.
 *
 * Globus shu savolning o'zi bo'lib qoladi: bezak emas, tanlash asbobi. U
 * allaqachon `interactive` va `onPick` ni qo'llab-quvvatlaydi, ya'ni yangi kod
 * yozilmaydi -- shunchaki markazga qo'yiladi.
 */
export default function V2Home() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState<Country[]>([])
  const [query, setQuery] = useState('')
  const [size, setSize] = useState(320)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<Country[]>('/countries').then((r) => setCountries(r.data)).catch(() => setCountries([]))
  }, [])

  // Globus kvadrat bo'lishi kerak va o'lchamini o'zi bilmaydi.
  useEffect(() => {
    const node = boxRef.current
    if (!node) return
    const ro = new ResizeObserver(() => setSize(Math.min(node.clientWidth, 420)))
    ro.observe(node)
    setSize(Math.min(node.clientWidth, 420))
    return () => ro.disconnect()
  }, [])

  const popular = useMemo(
    () => countries.filter((c) => c.is_popular).slice(0, 6),
    [countries],
  )

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return countries.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)
  }, [countries, query])

  const open = (slug: string) => navigate(`/yangi/${slug}`)

  const onPick = (pick: HeroGlobePick) => {
    if (pick.country) open(pick.country.slug)
  }

  return (
    <Shell>
      <div style={{ padding: '28px 18px 40px', maxWidth: 520, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'var(--v-t-hero)',
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          Qayerga borasiz?
        </h1>
        <p className="v-muted" style={{ marginTop: 8, fontSize: 'var(--v-t-lead)' }}>
          Davlatni tanlang — qolganini biz hisoblaymiz.
        </p>

        <div style={{ marginTop: 20, position: 'relative' }}>
          <input
            className="v-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Masalan: Turkiya"
            aria-label="Davlat qidirish"
          />
          {found.length > 0 && (
            <ul
              className="v-card"
              style={{
                position: 'absolute',
                zIndex: 5,
                insetInline: 0,
                marginTop: 6,
                padding: 6,
                listStyle: 'none',
                boxShadow: '0 18px 40px rgb(0 0 0 / 0.10)',
              }}
            >
              {found.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c.slug)}
                    style={{
                      display: 'block',
                      width: '100%',
                      minHeight: 'var(--v-tap)',
                      padding: '0 12px',
                      textAlign: 'left',
                      border: 0,
                      borderRadius: 10,
                      background: 'transparent',
                      color: 'inherit',
                      font: 'inherit',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Globus -- sahifaning markazi. Katalog yuklanmaguncha u bezak
            rejimida turadi: sotilmaydigan davlatni bosdirib, keyin "yo'q"
            deyish -- eng yomon javob. */}
        <div ref={boxRef} style={{ marginTop: 26, display: 'grid', placeItems: 'center' }}>
          <HeroGlobe size={size} countries={countries} interactive onPick={onPick} />
        </div>

        <p className="v-muted" style={{ marginTop: 10, textAlign: 'center' }}>
          Globusni aylantirib, davlat ustiga bosing
        </p>

        {popular.length > 0 && (
          <section style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 'var(--v-t-lead)', fontWeight: 700 }}>Ko‘p tanlanadigan</h2>
            {/* Ikki ustun, uch emas: uchtada "Ozarbayj…" bo'lib qisqaradi. */}
            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gap: 10,
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              }}
            >
              {popular.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open(c.slug)}
                  className="v-card"
                  style={{
                    minHeight: 'var(--v-tap)',
                    padding: '14px 16px',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  )
}
