/**
 * Which catalogue regions one filter entry covers.
 *
 * `americas` is ours, not the backend's: the catalogue splits the continent
 * into North America and Latin America and the design shows one line. The
 * split stays in the data — this is a filter over it, not a rename of it — so
 * no country falls out of a region page, a sitemap entry or a regional plan.
 */
export function slugsFor(key: string): string[] {
  if (key === 'americas') return ['north-america', 'latin-america']
  return key ? [key] : []
}
