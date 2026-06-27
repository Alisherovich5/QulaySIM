import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { CountryDetail as CountryDetailType, Plan } from '../lib/types'
import PlanCard from '../components/PlanCard'
import Flag from '../components/Flag'
import Reveal from '../components/Reveal'
import { useCart } from '../context/CartContext'

export default function CountryDetail() {
  const { slug } = useParams()
  const [country, setCountry] = useState<CountryDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState<number | null>(null)
  const { add } = useCart()
  const { t } = useTranslation()

  useEffect(() => {
    setLoading(true)
    api
      .get<CountryDetailType>(`/countries/${slug}`)
      .then((r) => setCountry(r.data))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAdd = (plan: Plan) => {
    if (!country) return
    add(plan, country.name, country.iso2)
    setAdded(plan.id)
    setTimeout(() => setAdded(null), 1500)
  }

  if (loading) {
    return <div className="container-page py-16 text-slate-soft">{t('country.loadingPlans')}</div>
  }
  if (!country) {
    return (
      <div className="container-page py-16">
        <p className="text-slate-soft">{t('country.notFound')}</p>
        <Link to="/destinations" className="mt-4 inline-flex text-brand-600">
          {t('country.backToAll')}
        </Link>
      </div>
    )
  }

  return (
    <div className="container-page py-12">
      <Link
        to="/destinations"
        className="inline-flex items-center gap-1.5 text-sm font-600 text-slate-soft hover:text-brand-600"
      >
        <ArrowLeft size={16} /> {t('country.backToAll')}
      </Link>

      <div className="mt-6 flex items-center gap-5">
        <Flag
          iso2={country.iso2}
          w={160}
          alt={`${country.name} flag`}
          className="h-16 w-24 rounded-lg object-cover ring-1 ring-line"
        />
        <div>
          <h1 className="text-3xl font-700">{country.name}</h1>
          <p className="mt-1 text-slate-soft">
            {country.region?.name} · {t('country.plansAvailable', { count: country.plans.length })}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {country.plans.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 60}>
            <PlanCard plan={plan} onAdd={handleAdd} added={added === plan.id} />
          </Reveal>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link to="/checkout" className="btn-ghost px-6 py-3">
          <ShoppingBag size={18} /> {t('common.goToCart')}
        </Link>
      </div>
    </div>
  )
}
