import HeroSection from '../components/home/HeroSection'
import DestinationsExplorer from '../components/home/DestinationsExplorer'
import PopularPlans from '../components/home/PopularPlans'
import HowItWorks from '../components/home/HowItWorks'
import Compatibility from '../components/home/Compatibility'
import Testimonials from '../components/home/Testimonials'
import HomeFaq from '../components/home/HomeFaq'
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
      <div className="border-t border-line/70"><DestinationsExplorer /></div>
      {/* Right after the destinations grid: that section answers "where", this
          answers "how much", which is the question that starts a purchase. */}
      <PopularPlans />
      <HowItWorks />
      <Compatibility />
      <div className="border-t border-line/70"><Testimonials items={content?.testimonials} /></div>
      <div className="border-t border-line/70"><HomeFaq faqs={content?.faqs} /></div>
    </div>
  )
}
