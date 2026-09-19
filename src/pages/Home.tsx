import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import HeroSection from '../components/home/HeroSection'
import DestinationsExplorer from '../components/home/DestinationsExplorer'
import HowItWorks from '../components/home/HowItWorks'
import Testimonials from '../components/home/Testimonials'
import Seo from '../components/Seo'
import { useLandingContent } from '../lib/useLandingContent'
import { HOME_GEO } from '../lib/geo'
import { organisationLd, webSiteLd } from '../lib/structured-data'
import type { SeoLang } from '../lib/seo'

/* Lazy, and for one reason: both of these are whole pages mounted again, and
   statically importing them would pull route-page.css, support.css and their
   component trees into the entry bundle — which has 150 kB to spend and was at
   148. Both sit below the fold, so the chunk is fetched while the visitor is
   still reading the hero. The placeholder reserves roughly the height each one
   settles at, so nothing under them jumps when they arrive. */
const RouteSection = lazy(() => import('../components/route/RouteSection'))
const SupportBody = lazy(() => import('../components/support/SupportBody'))

function Placeholder({ height }: { height: number }) {
  return <div aria-hidden style={{ minHeight: height }} />
}

/**
 * Landing page — light, eSIMCard-style sectioned layout.
 * Content is admin-managed (fetched once here); each section falls back to its
 * i18n defaults if the CMS is unreachable or empty.
 *
 * Two of the sections are other pages: the route planner sits where a static
 * teaser for the worldwide bundles used to be, and the help centre closes the
 * page where a second copy of the FAQ used to. Both are the same components
 * /marshrut and /support mount, not versions of them.
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
      <div className="border-t border-line/70">
        <Suspense fallback={<Placeholder height={760} />}>
          <RouteSection />
        </Suspense>
      </div>
      <div className="border-t border-line/70"><Testimonials items={content?.testimonials} /></div>
      <div className="border-t border-line/70">
        <Suspense fallback={<Placeholder height={900} />}>
          <SupportBody />
        </Suspense>
      </div>
    </div>
  )
}
