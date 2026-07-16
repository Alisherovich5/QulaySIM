import { Star } from 'lucide-react'
import Card from './Card'

interface TestimonialProps {
  name: string
  location: string
  text: string
  rating: number
}

const CITY_FLAGS: Record<string, string> = {
  tashkent: '🇺🇿',
  toshkent: '🇺🇿',
  ташкент: '🇺🇿',
  tokyo: '🇯🇵',
  tokio: '🇯🇵',
  токио: '🇯🇵',
  berlin: '🇩🇪',
  берлин: '🇩🇪',
  dubai: '🇦🇪',
  dubay: '🇦🇪',
  дубай: '🇦🇪',
  madrid: '🇪🇸',
  мадрид: '🇪🇸',
  bangkok: '🇹🇭',
  бангкок: '🇹🇭',
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
