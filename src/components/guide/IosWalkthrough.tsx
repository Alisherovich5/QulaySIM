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
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 sm:gap-x-5">
      <IPhoneFrame label={t('guides.install.shot1')}>
        <ScreenTitle>{t('guides.install.screenSettings')}</ScreenTitle>
        {/* Enough rows that the screen looks like a settings page rather than a
            list floating in space. A half-empty phone reads as unfinished, and
            the row being pointed at is easier to find among neighbours anyway —
            which is the situation the customer is actually in. */}
        <ScreenList>
          <ScreenRow>Wi-Fi</ScreenRow>
          <ScreenRow>Bluetooth</ScreenRow>
          <ScreenRow highlight>Cellular</ScreenRow>
          <ScreenRow>Battery</ScreenRow>
          <ScreenRow>Privacy</ScreenRow>
        </ScreenList>
        {/* Four, not six. Eleven rows overflowed the screen and the clip landed
            mid-row, so "Privacy" was sliced in half with the next group sitting
            on top of it — which looks broken rather than scrolled. */}
        <ScreenList>
          <ScreenRow>General</ScreenRow>
          <ScreenRow>Notifications</ScreenRow>
          <ScreenRow>Sounds &amp; Haptics</ScreenRow>
          <ScreenRow>Display</ScreenRow>
        </ScreenList>
      </IPhoneFrame>

      <IPhoneFrame label={t('guides.install.shot2')} raised>
        <ScreenTitle>Cellular</ScreenTitle>
        <ScreenList>
          <ScreenRow value={t('guides.install.on')} chevron={false}>
            Cellular Data
          </ScreenRow>
          <ScreenRow>Personal Hotspot</ScreenRow>
        </ScreenList>
        <ScreenTitle>SIM</ScreenTitle>
        <ScreenList>
          <ScreenRow highlight>Add eSIM</ScreenRow>
          <ScreenRow>Cellular Plans</ScreenRow>
          <ScreenRow>Network Selection</ScreenRow>
          <ScreenRow>Wi-Fi Calling</ScreenRow>
          <ScreenRow>SIM PIN</ScreenRow>
        </ScreenList>
      </IPhoneFrame>

      <IPhoneFrame label={t('guides.install.shot3')} raised>
        <ScreenTitle>Add eSIM</ScreenTitle>
        <ScreenList>
          <ScreenRow highlight>Use QR Code</ScreenRow>
          <ScreenRow>Enter Details Manually</ScreenRow>
        </ScreenList>
        <p className="px-1 pt-1 text-[8px] leading-snug text-slate-400 dark:text-slate-500">
          {t('guides.install.shot3Hint')}
        </p>
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
        <ScreenTitle>{t('guides.install.screenOther')}</ScreenTitle>
        <ScreenList>
          <ScreenRow value={t('guides.install.on')} chevron={false}>
            {t('guides.install.rowTurnOn')}
          </ScreenRow>
          <ScreenRow>Network Selection</ScreenRow>
          <ScreenRow value={t('guides.install.off')} chevron={false}>
            Data Roaming
          </ScreenRow>
        </ScreenList>
        <p className="px-1 pt-1 text-[8px] leading-snug text-slate-400 dark:text-slate-500">
          {t('guides.install.shot4Note')}
        </p>
      </IPhoneFrame>
    </div>
  )
}
