/**
 * The topics the FAQ answers are filed under, shared by the support page and
 * the landing page's FAQ.
 *
 * Kept in one place because the two pages label the same keys: two copies of
 * this map is two chances for the landing page to call `billing` "To'lov" for a
 * year after somebody renamed it on the support page.
 */

/** The order the design lists them in. A key that is not here sorts after the
 *  ones that are, so a topic the operator adds shows up rather than vanishing. */
export const CATEGORY_ORDER = ['general', 'setup', 'billing', 'data', 'device']

/** Translation keys for the topics the API sends. A key with no entry here is
 *  shown under its own name rather than hidden. */
export const CATEGORY_LABELS: Record<string, string> = {
  general: 'support.catGeneral',
  setup: 'support.catSetup',
  billing: 'support.catBilling',
  device: 'support.catDevice',
  data: 'support.catData',
}

export function categoryRank(key: string): number {
  const index = CATEGORY_ORDER.indexOf(key)
  return index === -1 ? CATEGORY_ORDER.length : index
}
