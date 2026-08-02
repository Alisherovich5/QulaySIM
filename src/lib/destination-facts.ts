/**
 * What makes one destination page different from the other twenty-four.
 *
 * Every country page was built from the same template: a flag, a name, a region
 * and a grid of plan cards. To a search engine that is twenty-five near-identical
 * documents, and near-identical documents compete with each other rather than
 * with Airalo — Google picks one, files the rest as duplicates, and none of them
 * rank. The pages already *held* distinguishing information; they simply never
 * said any of it in words.
 *
 * So this pulls the facts that genuinely differ — how many plans, what they
 * cost, how long they last, which networks carry them — out of the plan list the
 * page has already loaded. Nothing here is fetched, invented or estimated: every
 * number is computed from the plans the customer is about to see, which is what
 * makes it safe to put in a meta description as well as on the page.
 */

import type { Plan } from './types'

export interface DestinationFacts {
  planCount: number
  minPrice: number
  maxPrice: number
  /** Sorted, de-duplicated: ["4G", "5G"]. */
  networks: string[]
  minDays: number
  maxDays: number
  hasUnlimited: boolean
  /** True only when *every* plan supports it — a partial yes would mislead. */
  hotspot: boolean
}

export function factsFor(plans: Plan[]): DestinationFacts | null {
  const priced = plans.filter((p) => Number.isFinite(p.price_usd) && p.price_usd > 0)
  if (priced.length === 0) return null

  const prices = priced.map((p) => p.price_usd)
  const days = priced.map((p) => p.validity_days).filter((d) => d > 0)
  const networks = [
    ...new Set(
      priced
        // "4G/5G" and "4G" both occur; split so the set is of individual
        // generations rather than of the strings the supplier happened to send.
        .flatMap((p) => (p.network_type || '').split(/[\s,/]+/))
        .map((n) => n.trim().toUpperCase())
        .filter(Boolean),
    ),
  ].sort()

  return {
    planCount: priced.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    networks,
    minDays: days.length ? Math.min(...days) : 0,
    maxDays: days.length ? Math.max(...days) : 0,
    hasUnlimited: priced.some((p) => p.is_unlimited),
    hotspot: priced.every((p) => p.supports_hotspot),
  }
}

/**
 * The interpolation values for `seo.countryDescriptionRich`.
 *
 * Split out from the sentence itself so the prerenderer — which has no i18next —
 * can build the identical string from the identical numbers. The baked
 * description and the one React renders have to match, or the page would
 * advertise one thing to a crawler and another to a browser.
 */
export function descriptionParams(
  country: string,
  facts: DestinationFacts,
): Record<string, string | number> {
  return {
    country,
    count: facts.planCount,
    price: facts.minPrice.toFixed(2),
    days: facts.minDays === facts.maxDays ? `${facts.minDays}` : `${facts.minDays}–${facts.maxDays}`,
    networks: facts.networks.join('/'),
  }
}

/** Fill `{{name}}` placeholders without i18next, for the build-time renderer. */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in params ? String(params[key]) : whole,
  )
}
