import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './v2.css'

/**
 * Yangi interfeysning tashqi ramkasi.
 *
 * Ataylab juda kam narsa bor: logotip va bitta yordam havolasi. Hozirgi
 * saytning yuqorisida til, valyuta, tema, savat, profil va chegirma tasmasi --
 * oltita boshqaruv, va ularning hech biri "menga eSIM kerak" degan savolga
 * javob bermaydi. Ular kerak bo'lganda, kerak bo'lgan joyda chiqadi.
 */
export function Shell({ children, back }: { children: ReactNode; back?: { to: string; label: string } }) {
  return (
    <div className="v2" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--v-line)',
          background: 'var(--v-card)',
        }}
      >
        {back ? (
          <Link
            to={back.to}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              color: 'var(--v-ink)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>‹</span>
            {back.label}
          </Link>
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Qulay<span style={{ color: 'var(--v-brand)' }}>sim</span>
          </span>
        )}
        <a
          href="https://t.me/qulaysim_support"
          target="_blank"
          rel="noreferrer"
          style={{
            marginLeft: 'auto',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--v-ink-2)',
            textDecoration: 'none',
          }}
        >
          Yordam
        </a>
      </header>

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
