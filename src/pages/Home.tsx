import { useTranslation } from 'react-i18next'
import GlobalTeaser from '../components/GlobalTeaser'
import HeroSection from '../components/home/HeroSection'
import DestinationsExplorer from '../components/home/DestinationsExplorer'
import HowItWorks from '../components/home/HowItWorks'
import Testimonials from '../components/home/Testimonials'
import Seo from '../components/Seo'
import { useLandingContent } from '../lib/useLandingContent'
import { HOME_GEO } from '../lib/geo'
import { organisationLd, webSiteLd } from '../lib/structured-data'
import type { SeoLang } from '../lib/seo'

/**
 * Landing page — light, eSIMCard-style sectioned layout.
 * Content is admin-managed (fetched once here); each section falls back to its
 * i18n defaults if the CMS is unreachable or empty.
 */
export default function Home() {
  const content = useLandingContent()
  const { t, i18n } = useTranslation()

  return (
    <div>
      <Seo
        title={t('seo.homeTitle')}
        description={t('seo.homeDescription')}
        // The storefront itself is about Uzbekistan — that is the market it is
        // written for, priced in and supported in. Each destination page then
        // says which country *it* is about.
        geo={HOME_GEO}
        jsonLd={[
          organisationLd(),
          webSiteLd((i18n.resolvedLanguage ?? 'uz') as SeoLang),
        ]}
      />
      <HeroSection />
      <div className="border-t border-line/70"><DestinationsExplorer /></div>
      {/* HowItWorks carries its own border-y, so it supplies the divider the
          destinations grid needs below it — no wrapper here. */}
      <HowItWorks />
      <div className="border-t border-line/70"><GlobalTeaser variant="section" /></div>
      <div className="border-t border-line/70"><Testimonials items={content?.testimonials} /></div>
    </div>
  )
}
