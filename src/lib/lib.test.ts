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
import { dataLabel, usedLabel, usedTile } from './format'
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
    expect(usedLabel(472)).toBe('472 MB')
  })

  it('does not turn one megabyte into "0.0 GB"', () => {
    // Aynan shu yozuv tufayli mijoz "sayt qolgan MB ni ko'rsatmayapti" deb
    // yozdi -- holbuki raqam to'g'ri edi, shunchaki 1 MB gigabaytda nolga
    // aylanib qolgan edi.
    expect(usedLabel(1)).toBe('1 MB')
    expect(usedLabel(0)).toBe('0 MB')
  })

  it('reads a large allowance in gigabytes, not four-digit megabytes', () => {
    expect(usedLabel(3071)).toBe('2.9 GB')
    expect(usedLabel(1024)).toBe('1 GB')
    expect(usedLabel(20480)).toBe('20 GB')
  })

  it('does not show a negative remainder', () => {
    // Ta'minotchi tugagan tarifda 3073/3072 qaytaradi, ya'ni qoldiq -1 MB.
    expect(usedLabel(-1)).toBe('0 MB')
  })

  it('rounds down at the gigabyte boundary too', () => {
    // 2047 MB -- deyarli 2 GB, lekin 2 GB emas.
    expect(usedLabel(2047)).toBe('1.9 GB')
  })
})

describe('usedTile', () => {
  it('bir megabaytni megabaytda beradi, "0.0 GB" emas', () => {
    // Mijozning skrinshotidagi aynan o'sha plitka.
    expect(usedTile(1)).toEqual({ value: 1, suffix: ' MB', decimals: 0 })
  })

  it('gigabaytdan oshsa gigabaytga o‘tadi', () => {
    expect(usedTile(2582)).toEqual({ value: 2582 / 1024, suffix: ' GB', decimals: 1 })
  })

  it('manfiy qiymatni nolga qisadi', () => {
    expect(usedTile(-5).value).toBe(0)
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
