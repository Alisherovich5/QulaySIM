import { describe, expect, it } from 'vitest'
import { addStop, featuredIndex, pickThree, plansCovering, removeStop } from './route-plan'
import type { Plan } from './types'

function plan(id: number, price: number, mb: number, coverage: string[]): Plan {
  return {
    id,
    scope: 'global',
    title: `Global ${mb / 1024} GB`,
    data_amount_mb: mb,
    is_unlimited: false,
    data_label: `${mb / 1024} GB`,
    validity_days: 30,
    price_usd: price,
    price_note: '',
    network_type: '5G',
    supports_hotspot: true,
    is_popular: false,
    coverage,
  }
}

describe('the itinerary', () => {
  it('does not add the same country twice', () => {
    const once = addStop([], 'TR')
    expect(addStop(once, 'TR')).toBe(once)
  })

  it('treats a lower-case code as the same country', () => {
    expect(addStop(['TR'], 'tr')).toEqual(['TR'])
  })

  it('keeps the order countries were chosen in', () => {
    expect(addStop(addStop(addStop([], 'TR'), 'IT'), 'FR')).toEqual(['TR', 'IT', 'FR'])
  })

  it('removes the one asked for and nothing else', () => {
    expect(removeStop(['TR', 'IT', 'FR'], 'IT')).toEqual(['TR', 'FR'])
  })

  it('returns the same list when removing something that is not there', () => {
    const stops = ['TR']
    expect(removeStop(stops, 'IT')).toBe(stops)
  })
})

describe('coverage decides what is shown', () => {
  const covers3 = plan(1, 18, 3072, ['TR', 'IT', 'FR'])
  const missesFrance = plan(2, 9, 3072, ['TR', 'IT'])

  it('drops a plan that misses one of the stops', () => {
    expect(plansCovering([covers3, missesFrance], ['TR', 'IT', 'FR'])).toEqual([covers3])
  })

  it('does not merely rank the cheaper uncovered plan lower', () => {
    // The cheap one is cheap *because* it omits France. Ranking it second would
    // still sell it to somebody who lands in Paris with no data.
    const shown = plansCovering([covers3, missesFrance], ['FR'])
    expect(shown).not.toContain(missesFrance)
  })

  it('shows everything while no country has been chosen', () => {
    expect(plansCovering([covers3, missesFrance], [])).toHaveLength(2)
  })

  it('drops a plan whose coverage is unknown once a stop is chosen', () => {
    const noCoverage = plan(3, 5, 1024, [])
    expect(plansCovering([noCoverage], ['TR'])).toEqual([])
  })
})

describe('the three cards', () => {
  it('climbs: each card is more data and more money than the one before', () => {
    const picked = pickThree([
      plan(1, 43, 10240, ['TR']),
      plan(2, 18, 3072, ['TR']),
      plan(3, 25.5, 5120, ['TR']),
      plan(4, 19, 3072, ['TR']),
    ])
    expect(picked.map((p) => p.data_amount_mb)).toEqual([3072, 5120, 10240])
    expect(picked.map((p) => p.price_usd)).toEqual([18, 25.5, 43])
  })

  it('drops a bigger bundle that costs less than a smaller one', () => {
    // Real case: 20 GB over 106 countries is cheaper than 5 GB over 167. Shown
    // side by side the row reads 3, 20, 5 — numbers going up and down are a
    // puzzle, not a choice.
    const picked = pickThree([
      plan(1, 18, 3072, ['TR']),
      plan(2, 25.5, 5120, ['TR']),
      plan(3, 22, 20480, ['TR']),
      plan(4, 43, 10240, ['TR']),
    ])
    expect(picked.map((p) => p.data_amount_mb)).toEqual([3072, 5120, 10240])
  })

  it('would rather show two cards than one that costs less for more', () => {
    // The cheap 5 GB sits between two plans that do climb, so dropping it is
    // the only way the row still reads left to right. Two honest cards beat
    // three that contradict each other.
    const picked = pickThree([
      plan(1, 18, 3072, ['TR']),
      plan(2, 12, 5120, ['TR']),
      plan(3, 43, 10240, ['TR']),
    ])
    expect(picked.map((p) => p.data_amount_mb)).toEqual([3072, 10240])
  })

  it('takes the cheapest plan at each size', () => {
    const picked = pickThree([plan(1, 24, 3072, ['TR']), plan(2, 18, 3072, ['TR'])])
    expect(picked.map((p) => p.id)).toEqual([2])
  })

  it('never shows two cards of the same size', () => {
    const picked = pickThree([
      plan(1, 18, 3072, ['TR']),
      plan(2, 19, 3072, ['TR']),
      plan(3, 20, 3072, ['TR']),
    ])
    expect(picked).toHaveLength(1)
  })

  it('returns what there is when the catalogue is thin', () => {
    expect(pickThree([])).toEqual([])
  })

  it('highlights the middle card only when there are three', () => {
    expect(featuredIndex(3)).toBe(1)
    expect(featuredIndex(2)).toBe(-1)
    expect(featuredIndex(1)).toBe(-1)
  })
})
