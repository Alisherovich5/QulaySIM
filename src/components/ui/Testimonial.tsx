import { Star } from 'lucide-react'
import Card from './Card'

interface TestimonialProps {
  name: string
  location: string
  text: string
  rating: number
}

/**
 * City → flag, because the review data stores a route as free text.
 *
 * A city that is not listed here silently loses its flag — which is how
 * "Samarqand → Dubay" ended up with one flag and "Buxoro → Istanbul" with none
 * while "Toshkent → Tokio" had both. Add the city here when adding a review, in
 * all three spellings the admin might use.
 */
const CITY_FLAGS: Record<string, string> = {
  // Uzbekistan — where our travellers start
  tashkent: '🇺🇿',
  toshkent: '🇺🇿',
  ташкент: '🇺🇿',
  samarkand: '🇺🇿',
  samarqand: '🇺🇿',
  самарканд: '🇺🇿',
  bukhara: '🇺🇿',
  buxoro: '🇺🇿',
  бухара: '🇺🇿',
  khiva: '🇺🇿',
  xiva: '🇺🇿',
  хива: '🇺🇿',
  namangan: '🇺🇿',
  наманган: '🇺🇿',
  andijan: '🇺🇿',
  andijon: '🇺🇿',
  андижан: '🇺🇿',
  fergana: '🇺🇿',
  fargona: '🇺🇿',
  фергана: '🇺🇿',
  nukus: '🇺🇿',
  нукус: '🇺🇿',
  // The promoted destinations
  istanbul: '🇹🇷',
  istanbul_tr: '🇹🇷',
  истанбул: '🇹🇷',
  стамбул: '🇹🇷',
  antalya: '🇹🇷',
  анталия: '🇹🇷',
  tbilisi: '🇬🇪',
  tbilisi_ge: '🇬🇪',
  тбилиси: '🇬🇪',
  batumi: '🇬🇪',
  батуми: '🇬🇪',
  hanoi: '🇻🇳',
  ханой: '🇻🇳',
  'ho chi minh': '🇻🇳',
  bangkok: '🇹🇭',
  бангкок: '🇹🇭',
  phuket: '🇹🇭',
  пхукет: '🇹🇭',
  'kuala lumpur': '🇲🇾',
  'куала-лумпур': '🇲🇾',
  beijing: '🇨🇳',
  pekin: '🇨🇳',
  пекин: '🇨🇳',
  shanghai: '🇨🇳',
  shanxay: '🇨🇳',
  шанхай: '🇨🇳',
  baku: '🇦🇿',
  boku: '🇦🇿',
  баку: '🇦🇿',
  dubai: '🇦🇪',
  dubay: '🇦🇪',
  дубай: '🇦🇪',
  'abu dhabi': '🇦🇪',
  doha: '🇶🇦',
  доха: '🇶🇦',
  // Kept from the previous list so older reviews do not lose their flags
  tokyo: '🇯🇵',
  tokio: '🇯🇵',
  токио: '🇯🇵',
  berlin: '🇩🇪',
  берлин: '🇩🇪',
  madrid: '🇪🇸',
  мадрид: '🇪🇸',
  seoul: '🇰🇷',
  seul: '🇰🇷',
  сеул: '🇰🇷',
  paris: '🇫🇷',
  parij: '🇫🇷',
  париж: '🇫🇷',
}

function locationWithFlags(location: string) {
  return location.split('→').map((city) => {
    const clean = city.trim()
    const flag = CITY_FLAGS[clean.toLocaleLowerCase()]
    return flag ? `${flag} ${clean}` : clean
  }).join('  →  ')
}

/** Customer review card with gold star rating. */
export default function Testimonial({ name, location, text, rating }: TestimonialProps) {
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'fill-gold-500 text-gold-500' : 'text-line'}
          />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-soft">“{text}”</p>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 font-display font-700 text-brand-600">
          {name.charAt(0)}
        </span>
        <div>
          <p className="font-600 text-ink">{name}</p>
          <p className="mt-0.5 text-xs text-slate-soft">{locationWithFlags(location)}</p>
        </div>
      </div>
    </Card>
  )
}
