/**
 * The one rule that broke twice in a single day.
 *
 * Every page that draws the catalogue follows the same three steps: start from
 * the copy baked into the HTML, ask the API for a fresher one, and — this is the
 * step that keeps getting missed — keep what is on screen when the request does
 * not arrive. Written out by hand at six call sites, two of them had it wrong:
 * the home page's country strip replaced its 25 baked countries with an empty
 * list, and the hero's globe never read the baked copy at all. Both surfaced as
 * "the countries disappeared".
 *
 * So the decision moves here, where it can be stated once and tested
 * exhaustively, instead of being remembered six times.
 */

import { describe, expect, it } from 'vitest'

import { nextData } from './catalogue'

type Country = { slug: string }

const baked: Country[] = [{ slug: 'turkey' }, { slug: 'georgia' }]
const fresh: Country[] = [{ slug: 'turkey' }, { slug: 'georgia' }, { slug: 'egypt' }]

describe('nextData', () => {
  it('takes the answer that arrived', () => {
    expect(nextData(baked, { kind: 'ok', data: fresh })).toBe(fresh)
  })

  it('keeps what is on screen when the request fails', () => {
    // The whole reason this module exists.
    expect(nextData(baked, { kind: 'failed' })).toBe(baked)
  })

  it('keeps an empty answer that actually arrived', () => {
    // An empty list is a fact — a region with nothing in it — and must not be
    // confused with a failure. This is the other half of the rule.
    const empty: Country[] = []
    expect(nextData(baked, { kind: 'ok', data: empty })).toBe(empty)
  })

  it('holds nothing when there was nothing and the request failed', () => {
    expect(nextData(null, { kind: 'failed' })).toBeNull()
  })

  it('clears only when the thing is genuinely gone and the caller says so', () => {
    // A destination deleted in the admin must stop rendering; a lost packet
    // must not. Only a real 404 may clear, and only where clearing is right.
    expect(nextData(baked, { kind: 'missing' }, { clearOnMissing: true })).toBeNull()
    expect(nextData(baked, { kind: 'missing' })).toBe(baked)
  })

  it('never invents data', () => {
    // Whatever comes out is either the previous value or the one that arrived —
    // never a merge, never a partial. A merge would show a country the API had
    // just removed.
    for (const outcome of [{ kind: 'failed' } as const, { kind: 'missing' } as const]) {
      const result = nextData(baked, outcome)
      expect(result === baked || result === null).toBe(true)
    }
  })
})
