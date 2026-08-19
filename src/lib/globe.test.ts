/**
 * The table that decides which countries the globe lights up.
 *
 * It is a join between two files that know nothing about each other: our
 * catalogue speaks ISO alpha-2, and world-110m.json identifies its polygons by
 * ISO numeric. A missing row is invisible — the country simply does not rise,
 * and nothing anywhere reports it. That is how 207 destinations became 175 lit
 * ones without a single error, until somebody counted them on screen.
 */

import { describe, expect, it } from 'vitest'

// Imported rather than read off disk: this file is type-checked with the app's
// browser tsconfig, which has no Node types — and importing it is also what
// proves the file Vite ships is the file this table was written against.
import worldTopology from '../../public/world-110m.json'

import { ISO2_TO_NUMERIC, numericFor } from './isoNumeric'

interface Topology {
  objects: { countries: { geometries: { id?: string; properties?: { name?: string } }[] } }
}

const topology = worldTopology as unknown as Topology
const geometries = topology.objects.countries.geometries
const byNumeric = new Map(geometries.map((g) => [Number(g.id), g.properties?.name ?? '']))

describe('ISO2_TO_NUMERIC', () => {
  it('never lets two countries claim the same polygon', () => {
    // A duplicate is worse than a gap: one country steals the other's landmass,
    // and clicking it opens the wrong destination.
    const codes = Object.values(ISO2_TO_NUMERIC)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('maps the six that were dark', () => {
    // Each of these is sold, is drawn by world-110m.json, and was unlit.
    for (const [iso2, numeric] of [['BT', 64], ['GL', 304], ['NC', 540], ['PR', 630], ['RW', 646], ['SN', 686]] as const) {
      expect(numericFor(iso2), iso2).toBe(numeric)
      expect(byNumeric.has(numeric), `${iso2} → ${numeric} must exist in the topology`).toBe(true)
    }
  })

  it('reads a lower-case code, because the API is not asked to shout', () => {
    expect(numericFor('uz')).toBe(860)
    expect(numericFor('uz')).toBe(numericFor('UZ'))
  })

  it('agrees with the topology on the countries it names', () => {
    // A typo'd numeric points at whichever country happens to own it, so a few
    // are checked against the polygon's own name rather than against nothing.
    const expected: Record<string, string> = {
      TR: 'Turkey', UZ: 'Uzbekistan', RW: 'Rwanda', SN: 'Senegal', GL: 'Greenland', JP: 'Japan',
    }
    for (const [iso2, name] of Object.entries(expected)) {
      expect(byNumeric.get(numericFor(iso2)!), iso2).toContain(name)
    }
  })

  it('still lines up with the topology file at all', () => {
    // The canary. Swap world-110m.json for a build that identifies polygons by
    // alpha-3, or ship a truncated one, and every match silently fails — a globe
    // with nothing raised and no error to read. 150 is a floor, not a target.
    const present = Object.values(ISO2_TO_NUMERIC).filter((n) => byNumeric.has(n))
    expect(present.length).toBeGreaterThan(150)
  })
})
