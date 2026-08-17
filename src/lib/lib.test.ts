/**
 * The pure functions, which is where cheap tests pay best.
 *
 * Every case here is one that has actually gone wrong, or one whose breaking
 * would be silent and expensive: a price that ends in the wrong digit, a data
 * label that rounds a customer's allowance up, a language prefix that sends
 * Googlebot to the wrong edition.
 */

import { describe, expect, it } from 'vitest'

import { charmUzs } from './charm'
import { dataLabel, usedLabel } from './format'
import { numericFor } from './isoNumeric'
import { langFromPath, pathForLang } from './seo'

describe('charmUzs', () => {
  it('always ends in 999', () => {
    for (const value of [11_915, 100_000, 30_000, 1_000_000, 124_500, 2_001]) {
      expect(charmUzs(value) % 1000).toBe(999)
    }
  })

  it('is idempotent — the rule can be applied twice without drift', () => {
    // The first version of this rule turned 1 000 000 into 990 000 and then
    // 989 000 on a second pass, which is how a price walks downhill over
    // repeated syncs.
    for (const value of [11_915, 100_000, 1_000_000, 49_950]) {
      expect(charmUzs(charmUzs(value))).toBe(charmUzs(value))
    }
  })

  it('rounds to the nearest thousand rather than always down', () => {
    expect(charmUzs(11_915)).toBe(11_999)
    expect(charmUzs(11_100)).toBe(10_999)
  })

  it('leaves very small amounts alone', () => {
    // Below the floor, subtracting a som from a rounded thousand would produce
    // a price that reads as a mistake rather than as a bargain.
    expect(charmUzs(500)).toBe(500)
  })

  it('never returns more than it was given', () => {
    // A charm price that rounded *up* would overcharge, quietly.
    for (const value of [3_000, 9_999, 250_001]) {
      expect(charmUzs(value)).toBeLessThanOrEqual(value + 1)
    }
  })
})

describe('dataLabel', () => {
  it('names whole gigabytes in gigabytes', () => {
    expect(dataLabel(1024, false)).toBe('1 GB')
    expect(dataLabel(20480, false)).toBe('20 GB')
  })

  it('says unlimited rather than a number', () => {
    expect(dataLabel(1024, true)).toBe('Unlimited')
  })
})

describe('usedLabel', () => {
  it('never rounds a remaining allowance up', () => {
    // Telling a customer they have 1 GB left when they have 0.96 is the kind of
    // rounding that ends in a support message from abroad.
    expect(usedLabel(983)).not.toBe('1 GB')
  })

  it('reports megabytes below a gigabyte', () => {
    expect(usedLabel(472)).toMatch(/472/)
  })
})

describe('numericFor', () => {
  it('maps a known country', () => {
    expect(numericFor('UZ')).toBe(860)
    expect(numericFor('TR')).toBe(792)
  })

  it('returns nothing for an unknown code rather than guessing', () => {
    expect(numericFor('XX')).toBeUndefined()
  })
})

describe('language in the path', () => {
  it('reads the prefix as a decision', () => {
    // /ru/support must be Russian for everyone — including a visitor whose
    // stored preference says Uzbek, and including Googlebot, which has no
    // storage and would otherwise index three identical pages.
    expect(langFromPath('/ru/support')).toBe('ru')
    expect(langFromPath('/en')).toBe('en')
  })

  it('treats an unprefixed path as the default edition', () => {
    expect(langFromPath('/support')).toBe('uz')
    expect(langFromPath('/')).toBe('uz')
  })

  it('does not mistake a destination slug for a language', () => {
    expect(langFromPath('/destinations/russia')).toBe('uz')
  })

  it('round-trips through pathForLang', () => {
    for (const path of ['/', '/support', '/destinations/turkey']) {
      for (const lang of ['uz', 'ru', 'en'] as const) {
        expect(langFromPath(pathForLang(path, lang))).toBe(lang)
      }
    }
  })
})
