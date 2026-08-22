import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { deviceLabel, type EsimDevice } from '../../data/esimDevices'
import { CheckExactlyButton, Mark } from './shared'
import { REVEAL, verdictOf } from './verdictRules'
import { Button } from '../ui'

/**
 * The answer, and nothing before there is one.
 *
 * Three shapes, and the difference between them is the whole honesty of the
 * page: a model that always has an eSIM, a model sold in both forms (which says
 * so, and offers the fifteen-second check), and one that has none (which still
 * offers the check, because being wrong in that direction costs a sale we could
 * have had).
 *
 * `detected` is set when the browser told us the device rather than the visitor
 * typing it; the card then says so, and states the evidence.
 */
export default function Verdict({
  device,
  detected,
  iosVersion,
  unknownModel,
  onCheckExactly,
  ref,
}: {
  device: EsimDevice | null
  detected: 'model' | 'ios' | null
  iosVersion: number | null
  unknownModel: string | null
  onCheckExactly: () => void
  ref: React.Ref<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const picked = device
  const verdict = picked ? verdictOf(picked) : null

  return (
      <div ref={ref} aria-live="polite" className="scroll-mt-28">
        {detected === 'ios' && !picked && (
          <section className={`card elev-1 mt-3 p-4 sm:mt-4 sm:p-6 ${REVEAL}`}>
            <div className="flex items-start gap-3">
              <Mark verdict="yes" size="lg" />
              <div className="min-w-0">
                <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                  {t('device.detectedLabel')}
                </p>
                <h2 className="mt-1.5 font-display text-[20px] font-700 leading-tight text-ink sm:text-[24px]">
                  {t('device.iosYesTitle')}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
                  {t('device.iosYesText', { version: iosVersion ?? '' })}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Link
                    to="/destinations"
                    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[13.5px] font-700 text-white transition-colors hover:bg-brand-700"
                  >
                    {t('device.yesCta')} <ArrowRight size={16} />
                  </Link>
                  <CheckExactlyButton onClick={onCheckExactly} />
                </div>
              </div>
            </div>
          </section>
        )}

        {unknownModel && !picked && (
          <section className={`card elev-1 mt-3 p-4 sm:mt-4 sm:p-6 ${REVEAL}`}>
            <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
              {t('device.detectedLabel')}
            </p>
            <h2 className="mt-1.5 font-display text-[18px] font-700 leading-tight text-ink sm:text-[21px]">
              {unknownModel}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm">
              {t('device.detectedUnknown')}
            </p>
            <CheckExactlyButton onClick={onCheckExactly} tone="loud" className="mt-3" />
          </section>
        )}

        {picked && verdict && (
          <section key={deviceLabel(picked)} className={`mt-3 sm:mt-4 ${REVEAL}`}>
            {verdict === 'no' ? (
              <div className="card elev-1 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <Mark verdict="no" size="lg" />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                      {detected ? t('device.detectedLabel') : t('device.answerLabel')}
                    </p>
                    <h2 className="mt-1.5 font-display text-[20px] font-700 leading-tight text-ink sm:text-[24px]">
                      {deviceLabel(picked)}
                    </h2>
                    <p className="mt-1 font-display text-[15px] font-700 text-slate-soft">
                      {t('device.verdictNo')}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
                      {t('device.verdictNoText')}
                    </p>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      <CheckExactlyButton onClick={onCheckExactly} tone="loud" />
                      <Button to="/support" variant="ghost" className="min-h-11 px-4 text-[13.5px]">
                        {t('device.noCta')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 sm:p-6">
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-700 leading-none text-white ring-1 ring-white/25">
                    <Check size={12} strokeWidth={3.5} />
                    {detected ? t('device.detectedLabel') : t('device.answerLabel')}
                  </span>
                  <h2 className="mt-2.5 font-display text-[22px] font-700 leading-tight text-white sm:text-[26px]">
                    {deviceLabel(picked)}
                  </h2>
                  <p className="mt-1 font-display text-[15px] font-700 text-white/90">
                    {t('device.verdictYes')}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-white/85 sm:text-sm sm:leading-6">
                    {t('device.verdictYesText')}
                  </p>

                  {verdict === 'regional' && (
                    <p className="mt-3 rounded-xl bg-white/10 px-3 py-2.5 text-[12px] leading-[1.5] text-white/90 ring-1 ring-white/20">
                      {t('device.regionalNote')}
                    </p>
                  )}

                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <Link
                      to="/destinations"
                      className="focus-ring-invert inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-[13.5px] font-700 text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      {t('device.yesCta')} <ArrowRight size={16} />
                    </Link>
                    <CheckExactlyButton onClick={onCheckExactly} tone="invert" />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
  )
}
