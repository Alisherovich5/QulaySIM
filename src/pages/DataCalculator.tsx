import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, MessageCircle, MonitorPlay, Phone, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { boot } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import { estimateData, type Activity } from '../lib/data-estimate'
import { useDesignCopy } from '../lib/design-copy'
import type { Country } from '../lib/types'
import Seo from '../components/Seo'

const words = {
  uz: {
    title: 'Safaringizga qancha internet kerak?',
    lead: 'Safar muddatini va kunlik odatlaringizni belgilang. Mos internet hajmini taxmin qilamiz.',
    duration: 'Necha kunga ketasiz?',
    days: 'kun',
    daily: 'Kuniga qanday foydalanasiz?',
    hour: 'soat',
    map: 'Xarita va navigatsiya',
    chat: 'Yozishmalar',
    social: 'Ijtimoiy tarmoqlar',
    video: 'Video ko‘rish',
    call: 'Video qo‘ng‘iroqlar',
    result: 'Safar uchun tavsiya etilgan hajm',
    estimate: 'Hisoblangan sarf',
    destination: 'Qayerga borasiz?',
    all: 'Manzilni keyin tanlayman',
    cta: 'Tariflarni ko‘rish',
    note: 'Bu taxminiy hisob, kafolat emas. Sifat, ilova va fon yuklamalari sarfni o‘zgartiradi. Tavsiyaga 20% zaxira qo‘shilgan.',
  },
  en: {
    title: 'How much data does your trip need?',
    lead: 'Choose your trip length and daily habits. We’ll estimate a data allowance for your journey.',
    duration: 'How long is your trip?',
    days: 'days',
    daily: 'Your everyday usage',
    hour: 'hours',
    map: 'Maps and navigation',
    chat: 'Messaging',
    social: 'Social media',
    video: 'Streaming video',
    call: 'Video calls',
    result: 'Suggested data for your trip',
    estimate: 'Estimated usage',
    destination: 'Where are you going?',
    all: 'Choose a destination later',
    cta: 'Explore plans',
    note: 'An estimate, not a guarantee. Quality settings, apps and background downloads affect usage. The suggestion includes a 20% buffer.',
  },
  ru: {
    title: 'Сколько интернета нужно в поездке?',
    lead: 'Укажите срок поездки и ежедневные привычки. Рассчитаем примерный объём интернета.',
    duration: 'На сколько дней едете?',
    days: 'дней',
    daily: 'Как вы пользуетесь интернетом?',
    hour: 'ч',
    map: 'Карты и навигация',
    chat: 'Переписка',
    social: 'Социальные сети',
    video: 'Просмотр видео',
    call: 'Видеозвонки',
    result: 'Рекомендуемый объём на поездку',
    estimate: 'Расчётный расход',
    destination: 'Куда отправляетесь?',
    all: 'Выберу направление позже',
    cta: 'Смотреть тарифы',
    note: 'Это примерный расчёт, а не гарантия. Качество, приложения и фоновые загрузки влияют на расход. В рекомендации учтён запас 20%.',
  },
}
const activities = [
  { key: 'map', icon: MapPin },
  { key: 'chat', icon: MessageCircle },
  { key: 'social', icon: Smartphone },
  { key: 'video', icon: MonitorPlay },
  { key: 'call', icon: Phone },
] as const

export default function DataCalculator() {
  const { i18n, t } = useTranslation()
  const c = useDesignCopy()
  const lang = (i18n.resolvedLanguage?.split('-')[0] || 'uz') as keyof typeof words
  const w = words[lang] || words.uz
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState<Record<Activity, number>>({
    map: 1.5,
    chat: 1,
    social: 1,
    video: 0.5,
    call: 0.25,
  })
  const [destination, setDestination] = useState('')
  const { data } = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () => api.get<Country[]>('/countries').then((r) => r.data),
    deps: [i18n.language],
  })
  const estimate = estimateData(days, hours)
  const format = (value: number) =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value)
  return (
    <div className="qs-page qs-calculator container-page">
      <Seo title={t('seo.dataCalculatorTitle')} description={t('seo.dataCalculatorDescription')} />
      <header className="page-intro">
        <p className="eyebrow">{c.navEnough}</p>
        <h1>{w.title}</h1>
        <p>{w.lead}</p>
      </header>
      <div className="calculator-layout">
        <div className="calculator-controls">
          <fieldset>
            <legend>{w.duration}</legend>
            <div className="day-presets">
              {[3, 7, 14, 30].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={days === value}
                  onClick={() => setDays(value)}
                >
                  {value} {w.days}
                </button>
              ))}
            </div>
            <label className="calculator-days" htmlFor="trip-days">
              {w.duration}
              <input
                id="trip-days"
                name="trip-days"
                type="number"
                min="1"
                max="90"
                value={days}
                onChange={(event) => setDays(Math.max(1, Math.min(90, Number(event.target.value))))}
              />
              <span>{w.days}</span>
            </label>
          </fieldset>
          <fieldset>
            <legend>{w.daily}</legend>
            {activities.map(({ key, icon: Icon }) => (
              <div className="usage-row" key={key}>
                <label htmlFor={'usage-' + key}>
                  <Icon size={20} aria-hidden />
                  {w[key]}
                </label>
                <output htmlFor={'usage-' + key}>
                  {format(hours[key])} {w.hour}
                </output>
                <input
                  id={'usage-' + key}
                  name={'usage-' + key}
                  type="range"
                  min="0"
                  max="4"
                  step="0.25"
                  value={hours[key]}
                  onChange={(event) => setHours({ ...hours, [key]: Number(event.target.value) })}
                />
              </div>
            ))}
          </fieldset>
        </div>
        <aside className="data-estimate">
          <p>
            {w.result} · {days} {w.days}
          </p>
          <output aria-live="polite" aria-label={w.result}>
            ≈ {estimate.suggestedGb} GB
          </output>
          <p>
            {w.estimate}: {format(estimate.gb)} GB
          </p>
          <label htmlFor="estimate-destination">{w.destination}</label>
          <select
            id="estimate-destination"
            name="estimate-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">{w.all}</option>
            {data?.map((country) => (
              <option key={country.id} value={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
          <Link
            className="btn btn-primary"
            to={destination ? '/destinations/' + destination : '/destinations'}
          >
            {w.cta}
            <ArrowRight size={18} />
          </Link>
          <p className="estimate-note">{w.note}</p>
        </aside>
      </div>
    </div>
  )
}
