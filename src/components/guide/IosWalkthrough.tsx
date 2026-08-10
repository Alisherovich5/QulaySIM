import { QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IPhoneFrame, ScreenList, ScreenRow, ScreenTitle } from './IPhoneFrame'

/**
 * The four iOS screens an eSIM installation passes through.
 *
 * The written steps were already correct and still did not help enough: "Settings
 * → Cellular → Add eSIM" is three words for three screens, and someone who has
 * never done it cannot tell which row of a long settings list is the right one.
 * The highlighted row answers that in the one way prose cannot.
 *
 * Labels come from the translation catalogue, so the pictures speak Uzbek,
 * Russian and English along with the rest of the page. The row names are the ones
 * iOS actually shows, kept in English where iOS shows English on an
 * English-language phone and given the Uzbek beside it — a customer matching
 * words on a screen needs the words that are on their screen.
 */
export default function IosWalkthrough() {
  const { t } = useTranslation()

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <IPhoneFrame label={t('guides.install.shot1')}>
        <ScreenTitle>{t('guides.install.screenSettings')}</ScreenTitle>
        <ScreenList>
          <ScreenRow>Wi-Fi</ScreenRow>
          <ScreenRow>Bluetooth</ScreenRow>
          <ScreenRow highlight>Cellular</ScreenRow>
          <ScreenRow>Battery</ScreenRow>
          <ScreenRow>Privacy</ScreenRow>
        </ScreenList>
      </IPhoneFrame>

      <IPhoneFrame label={t('guides.install.shot2')}>
        <ScreenTitle>Cellular</ScreenTitle>
        <ScreenList>
          <ScreenRow value={t('guides.install.on')} chevron={false}>
            Cellular Data
          </ScreenRow>
          <ScreenRow highlight>Add eSIM</ScreenRow>
          <ScreenRow>Cellular Plans</ScreenRow>
        </ScreenList>
      </IPhoneFrame>

      <IPhoneFrame label={t('guides.install.shot3')}>
        <ScreenTitle>Add eSIM</ScreenTitle>
        <ScreenList>
          <ScreenRow highlight>Use QR Code</ScreenRow>
          <ScreenRow>Enter Details Manually</ScreenRow>
        </ScreenList>
        <div className="mt-3 grid place-items-center rounded-lg border-2 border-dashed border-brand-400 py-3">
          <QrCode size={30} className="text-brand-500" aria-hidden />
        </div>
      </IPhoneFrame>

      <IPhoneFrame label={t('guides.install.shot4')}>
        <ScreenTitle>{t('guides.install.screenLabel')}</ScreenTitle>
        <ScreenList>
          <ScreenRow value="QulaySIM" chevron={false}>
            {t('guides.install.rowLabel')}
          </ScreenRow>
          <ScreenRow value={t('guides.install.primary')} chevron={false}>
            {t('guides.install.rowCalls')}
          </ScreenRow>
          <ScreenRow value="QulaySIM" chevron={false} highlight>
            {t('guides.install.rowData')}
          </ScreenRow>
        </ScreenList>
        <p className="mt-2 px-1 text-[9px] leading-snug text-slate-500 dark:text-slate-400">
          {t('guides.install.shot4Note')}
        </p>
      </IPhoneFrame>
    </div>
  )
}
