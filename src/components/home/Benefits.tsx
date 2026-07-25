import {
  Globe2,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Benefit as BenefitItem } from '../../lib/types'
import Reveal from '../Reveal'
import { SectionHeading } from '../ui'

// Map admin-entered icon names to components, with a sensible fallback.
const ICON_MAP: Record<string, LucideIcon> = {
  Globe2,
  Radio,
  Zap,
  Wallet,
  ShieldCheck,
  Smartphone,
  Sparkles,
}
const FALLBACK_ICONS: LucideIcon[] = [Globe2, Radio, Zap, Wallet]

interface BenefitView {
  title: string
  text: string
  icon: LucideIcon
}

const VISUALS = [
  'from-cyan-500/20 via-brand-500/10 to-transparent',
  'from-blue-500/20 via-cyan-500/10 to-transparent',
  'from-emerald-500/20 via-brand-500/10 to-transparent',
  'from-amber-400/20 via-emerald-500/10 to-transparent',
]

function BenefitRow({ icon: Icon, title, text, reverse, index }: BenefitView & { reverse: boolean; index: number }) {
  return (
    <div className={`group grid h-full items-center gap-7 rounded-3xl border border-line bg-surface p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-6 lg:grid-cols-[0.82fr_1.18fr] ${reverse ? 'lg:[&>*:first-child]:order-2 lg:grid-cols-[1.18fr_0.82fr]' : ''}`}>
      <div className={`relative grid h-48 place-items-center overflow-hidden rounded-[1.35rem] bg-gradient-to-br ${VISUALS[index % VISUALS.length]} bg-surface-2 ring-1 ring-line`}>
        <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,var(--color-line)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-accent-400/25 blur-3xl"
        />
        <span className="absolute left-5 top-5 font-display text-xs font-700 tracking-[0.2em] text-slate-soft/60">0{index + 1}</span>
        <span className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-2xl shadow-brand-900/20 ring-1 ring-white/20 transition duration-300 group-hover:scale-105 group-hover:rotate-2">
          <Icon size={42} strokeWidth={1.6} />
        </span>
        <span className="absolute bottom-5 right-5 h-3 w-3 rounded-full bg-accent-400 shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-accent-400)_18%,transparent)]" />
      </div>
      <div className={reverse ? 'lg:px-7' : 'lg:px-7'}>
        <h3 className="text-xl font-700 sm:text-2xl">{title}</h3>
        <p className="mt-3 max-w-lg leading-7 text-slate-soft">{text}</p>
      </div>
    </div>
  )
}

/** "Why travellers trust us" — admin-managed (CMS) with i18n fallback. */
export default function Benefits({ items }: { items?: BenefitItem[] }) {
  const { t } = useTranslation()

  const benefits: BenefitView[] =
    items && items.length > 0
      ? items.map((b, i) => ({
          title: b.title,
          text: b.text,
          icon: ICON_MAP[b.icon] ?? FALLBACK_ICONS[i % FALLBACK_ICONS.length],
        }))
      : (t('home.benefits', { returnObjects: true }) as { title: string; text: string }[]).map(
          (b, i) => ({ ...b, icon: FALLBACK_ICONS[i % FALLBACK_ICONS.length] }),
        )

  return (
    <section className="container-page relative z-0 py-16">
      <SectionHeading align="center" title={t('home.benefitsTitle')} subtitle={t('home.benefitsSubtitle')} />
      <div className="mobile-scroll-gutter mt-10 flex snap-x gap-4 md:mx-0 md:block md:space-y-5 md:overflow-visible md:px-0 md:py-0">
        {benefits.map((b, i) => (
          <Reveal key={b.title} className="w-[290px] shrink-0 snap-start self-stretch md:w-auto md:min-w-0 md:self-auto">
            <BenefitRow icon={b.icon} title={b.title} text={b.text} reverse={i % 2 === 1} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
