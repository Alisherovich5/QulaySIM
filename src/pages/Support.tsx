import SupportBody from '../components/support/SupportBody'

/**
 * The help centre, on its own URL.
 *
 * All of it lives in SupportBody, because the same block is now also the foot of
 * the landing page. This page exists to give it an address, an h1 and its own
 * FAQPage markup; everything else is there.
 */
export default function Support() {
  return <SupportBody as="h1" seo />
}
