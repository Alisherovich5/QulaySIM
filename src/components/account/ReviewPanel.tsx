import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, MessageSquareText, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { Button, Card } from '../ui'

type ReviewStatus = {
  eligible: boolean
  status: 'pending' | 'approved' | 'rejected' | null
  rating: number | null
  location: string | null
  text: string | null
}

export default function ReviewPanel() {
  const { t } = useTranslation()
  const [state, setState] = useState<ReviewStatus | null>(null)
  const [rating, setRating] = useState(5)
  const [location, setLocation] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get<ReviewStatus>('/account/testimonial').then(({ data }) => {
      setState(data)
      if (data.rating) setRating(data.rating)
      if (data.location) setLocation(data.location)
      if (data.text) setComment(data.text)
    }).catch(() => setError(true))
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(false)
    try {
      const { data } = await api.post<ReviewStatus>('/account/testimonial', {
        rating,
        location,
        text: comment,
      })
      setState(data)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  if (!state) return <Card className="h-48 animate-pulse bg-line/30"><span /></Card>

  if (!state.eligible) {
    return (
      <Card className="p-8 text-center">
        <MessageSquareText className="mx-auto text-slate-soft" size={32} />
        <h2 className="mt-3 text-lg font-700">{t('account.reviewLockedTitle')}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-soft">{t('account.reviewLockedText')}</p>
      </Card>
    )
  }

  if (state.status === 'approved') {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto text-accent-500" size={34} />
        <h2 className="mt-3 text-lg font-700">{t('account.reviewApprovedTitle')}</h2>
        <p className="mt-2 text-sm text-slate-soft">{t('account.reviewApprovedText')}</p>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          {state.status === 'pending' ? <Clock3 size={21} /> : <MessageSquareText size={21} />}
        </span>
        <div>
          <h2 className="text-xl font-700">{state.status === 'pending' ? t('account.reviewPendingTitle') : t('account.reviewTitle')}</h2>
          <p className="mt-1 text-sm text-slate-soft">{state.status === 'pending' ? t('account.reviewPendingText') : t('account.reviewSubtitle')}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-600 text-ink">{t('account.reviewRating')}</label>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label={t('account.reviewRating')}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" role="radio" aria-checked={rating === value} onClick={() => setRating(value)} className="rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <Star size={26} className={value <= rating ? 'fill-gold-500 text-gold-500' : 'text-line'} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="review-location" className="text-sm font-600 text-ink">{t('account.reviewJourney')}</label>
          <input id="review-location" className="input mt-2" value={location} onChange={(e) => setLocation(e.target.value)} minLength={2} maxLength={120} required placeholder={t('account.reviewJourneyPlaceholder')} />
        </div>
        <div>
          <label htmlFor="review-text" className="text-sm font-600 text-ink">{t('account.reviewComment')}</label>
          <textarea id="review-text" className="input mt-2 min-h-32 resize-y" value={comment} onChange={(e) => setComment(e.target.value)} minLength={10} maxLength={1000} required placeholder={t('account.reviewCommentPlaceholder')} />
          <p className="mt-1 text-right text-xs text-slate-soft">{comment.length}/1000</p>
        </div>
        {error && <p className="text-sm text-red-500">{t('account.reviewError')}</p>}
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? t('account.reviewSending') : t('account.reviewSubmit')}
        </Button>
      </form>
    </Card>
  )
}
