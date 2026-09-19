import RouteSection from '../components/route/RouteSection'

/**
 * The route planner, on its own URL.
 *
 * All of it lives in RouteSection, because the same block is now also the
 * middle of the landing page. This page exists to give it an address, an h1 and
 * its own SEO; everything else is there.
 */
export default function RoutePlanner() {
  return <RouteSection as="h1" seo />
}
