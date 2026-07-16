import HeroSection from '../components/home/HeroSection'
import PromoBanner from '../components/home/PromoBanner'
import DestinationsExplorer from '../components/home/DestinationsExplorer'
import HowItWorks from '../components/home/HowItWorks'
import Compatibility from '../components/home/Compatibility'
import Benefits from '../components/home/Benefits'
import Testimonials from '../components/home/Testimonials'
import HomeFaq from '../components/home/HomeFaq'
import FinalCta from '../components/home/FinalCta'
import { useLandingContent } from '../lib/useLandingContent'

/**
 * Landing page — light, eSIMCard-style sectioned layout.
 * Content is admin-managed (fetched once here); each section falls back to its
 * i18n defaults if the CMS is unreachable or empty.
 */
export default function Home() {
  const content = useLandingContent()

  return (
    <div>
      <HeroSection />
      <PromoBanner promo={content?.promo ?? undefined} />
      <DestinationsExplorer />
      <HowItWorks />
      <Compatibility devices={content?.devices.map((d) => d.name)} />
      <Benefits items={content?.benefits} />
      <Testimonials items={content?.testimonials} />
      <HomeFaq faqs={content?.faqs} />
      <FinalCta />
    </div>
  )
}
