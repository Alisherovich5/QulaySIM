import type { ReactNode } from 'react'

/**
 * One of the three cards under the hero.
 *
 * The links are passed in rather than the card wrapping one, because the
 * install card carries two of them — an anchor around an element containing
 * two more anchors is invalid, and a screen reader reads the outer one over
 * both. The ticket notch is cut in support.css; the reason it is a mask is
 * written there.
 */
export default function SupportActionCard({
  icon,
  title,
  text,
  children,
  brand = false,
}: {
  icon: ReactNode
  title: string
  text: string
  children: ReactNode
  brand?: boolean
}) {
  return (
    <article className={`sup-card${brand ? ' is-brand' : ''}`}>
      <span className="sup-card-mark" aria-hidden>
        {icon}
      </span>
      <div className="sup-card-body">
        <h2>{title}</h2>
        <p>{text}</p>
        {children}
      </div>
    </article>
  )
}
