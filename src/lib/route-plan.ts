/**
 * Which tariffs actually cover the trip somebody just described.
 *
 * The page above this lets a traveller name their stops — Turkey, Italy,
 * France — and then shows tariffs. The only interesting question is which
 * tariffs are honest to show, and it is not a presentation question: the cheap
 * bundles are cheap because they omit a third of the world, and a customer who
 * finds that out on arrival finds it out abroad, where nothing can be fixed.
 *
 * So coverage is a filter, never a ranking. A plan that misses one of the
 * chosen countries is removed, not shown lower down.
 *
 * Pure functions with no React in them, so the rule can be tested directly
 * rather than through a rendered page.
 */

import type { Plan } from './types'

/** Uppercase ISO-2, because the catalogue and the picker disagree on case. */
export function normaliseIso(iso2: string): string {
  return iso2.trim().toUpperCase()
}

/**
 * Add a country to the itinerary, or leave the itinerary alone.
 *
 * Returning the same array when nothing changes is not a micro-optimisation:
 * the selector's effects depend on this list, and a fresh array for a duplicate
 * click would re-run them and re-fetch the catalogue for an unchanged trip.
 */
export function addStop(stops: readonly string[], iso2: string): readonly string[] {
  const code = normaliseIso(iso2)
  if (!code || stops.includes(code)) return stops
  return [...stops, code]
}

export function removeStop(stops: readonly string[], iso2: string): readonly string[] {
  const code = normaliseIso(iso2)
  return stops.includes(code) ? stops.filter((s) => s !== code) : stops
}

/**
 * The plans that cover every stop.
 *
 * With nothing chosen yet the whole list comes back: the page still has to show
 * what is on offer, and "no countries" is a question not yet asked rather than
 * an itinerary nothing covers.
 */
export function plansCovering(plans: readonly Plan[], stops: readonly string[]): Plan[] {
  if (stops.length === 0) return [...plans]
  const wanted = stops.map(normaliseIso)
  return plans.filter((plan) => {
    const coverage = (plan.coverage ?? []).map(normaliseIso)
    if (coverage.length === 0) return false
    return wanted.every((code) => coverage.includes(code))
  })
}

/**
 * Three tariffs that form a ladder: more data, more money, every step.
 *
 * Cheapest-first alone does not do it. The catalogue is priced by coverage as
 * well as by size, so a 20 GB bundle covering 106 countries costs less than a
 * 5 GB one covering 167 — and sorted on price the three cards came out 3 GB,
 * 20 GB, 5 GB. Three cards whose numbers go up and down are not a choice, they
 * are a puzzle.
 *
 * So: cheapest option at each size, then walk the sizes upwards and keep one
 * only when it also costs more than the last one kept. What survives is a row
 * a person can read left to right and stop at the point they are willing to
 * pay. Nothing is repriced or reordered afterwards — a plan is either on the
 * ladder or not on the page.
 */
export function pickThree(plans: readonly Plan[]): Plan[] {
  const cheapestBySize = new Map<number, Plan>()
  for (const plan of plans) {
    const size = plan.is_unlimited ? Number.MAX_SAFE_INTEGER : plan.data_amount_mb
    const held = cheapestBySize.get(size)
    if (!held || plan.price_usd < held.price_usd) cheapestBySize.set(size, plan)
  }

  const bySize = [...cheapestBySize.entries()].sort((a, b) => a[0] - b[0]).map(([, plan]) => plan)

  const ladder: Plan[] = []
  for (const plan of bySize) {
    const last = ladder[ladder.length - 1]
    if (last && plan.price_usd <= last.price_usd) continue
    ladder.push(plan)
    if (ladder.length === 3) break
  }
  return ladder
}

/**
 * Which card is the featured one — the middle of three, and nothing at all
 * when there are fewer. Highlighting the only card says nothing; highlighting
 * one of two says "not that one".
 */
export function featuredIndex(count: number): number {
  return count === 3 ? 1 : -1
}
