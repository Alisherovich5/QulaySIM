import {
  Castle,
  ChevronRight,
  Flag as FlagIcon,
  Globe,
  Landmark,
  Mountain,
  Tent,
  TreePalm,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'


/** The region list, in the order the design puts it and nowhere else. Which
 *  catalogue slugs each one covers is in lib/region-filter.ts, where the page
 *  reads it too. */
const REGION_RAIL = [
  { key: '', icon: Globe },
  { key: 'europe', icon: Landmark },
  { key: 'asia', icon: Castle },
  { key: 'middle-east', icon: TreePalm },
  { key: 'americas', icon: FlagIcon },
  { key: 'africa', icon: Tent },
  { key: 'oceania', icon: Mountain },
] as const

export default function RegionRail({
  value,
  available,
  onChange,
}: {
  value: string
  /** Rail keys the catalogue actually has countries for. A region with nothing
      behind it is not offered: picking it would empty the page, which is what
      "the countries disappeared" turned out to mean the last time one was. */
  available: ReadonlySet<string>
  onChange: (key: string) => void
}) {
  const { t } = useTranslation()
  const label = (key: string) =>
    key === '' ? t('dx.regionAll') : key === 'americas' ? t('dx.regionAmericas') : t(`region.${key}`)

  return (
    <nav aria-label={t('dx.regionsTitle')}>
      {REGION_RAIL.filter(({ key }) => key === '' || available.has(key)).map(({ key, icon: Icon }) => (
        <button
          key={key || 'all'}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={`dx-region focus-ring ${value === key ? 'is-on' : ''}`}
        >
          <Icon size={20} strokeWidth={1.7} aria-hidden />
          {label(key)}
          <ChevronRight size={18} aria-hidden className="dx-region-go" />
        </button>
      ))}
    </nav>
  )
}
