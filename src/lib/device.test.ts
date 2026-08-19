/**
 * The two things the device check gets wrong if nobody watches it.
 *
 * A search that ranks badly sends somebody to the wrong verdict about their own
 * phone — "13" has to mean iPhone 13 before it means Redmi Note 13 Pro+ — and an
 * iOS inference that drifts one version either way turns a certainty into a
 * guess. Both are pure functions, so both are cheap to pin down.
 */

import { describe, expect, it } from 'vitest'

import {
  DEVICE_BRANDS,
  ESIM_DEVICES,
  deviceLabel,
  findDevices,
  normalizeDeviceSearch,
} from '../data/esimDevices'
import { iosMajorFromUA } from './deviceHint'

const labels = (query: string) => findDevices(query).map(deviceLabel)

describe('findDevices', () => {
  it('puts an exact model first, whatever else contains the same digits', () => {
    expect(labels('iPhone 13')[0]).toBe('Apple iPhone 13')
    expect(labels('Galaxy A55')[0]).toBe('Samsung Galaxy A55')
  })

  it('answers the spellings people actually type', () => {
    // Each of these was a plausible way to write the same phone, and the
    // normaliser exists because none of them matched before.
    for (const query of ['iphone13', 'Apple iPhone 13', 'IPHONE 13']) {
      expect(labels(query)[0]).toBe('Apple iPhone 13')
    }
    expect(labels('samsung galaxy s23 ultra')[0]).toBe('Samsung Galaxy S23 Ultra')
  })

  it('finds a phone by the model number printed on its own screen', () => {
    // The string somebody reading *#06# or Settings actually has in front of
    // them is SM-A556, not "Galaxy A55".
    expect(labels('SM-A556')[0]).toBe('Samsung Galaxy A55')
    expect(labels('sm-s918')[0]).toBe('Samsung Galaxy S23 Ultra')
  })

  it('prefers a prefix over a substring, and the shorter name at equal rank', () => {
    const found = labels('note 13')
    expect(found[0]).toBe('Xiaomi Redmi Note 13')
    expect(found.indexOf('Xiaomi Redmi Note 13')).toBeLessThan(
      found.indexOf('Xiaomi Redmi Note 13 Pro+'),
    )
  })

  it('returns nothing for an empty query rather than the whole list', () => {
    expect(findDevices('')).toEqual([])
    expect(findDevices('   ')).toEqual([])
  })

  it('caps the list, because a suggestion box is not a catalogue', () => {
    expect(findDevices('a', 8).length).toBeLessThanOrEqual(8)
  })
})

describe('the list itself', () => {
  it('knows the phones sold most here, including the ones that cannot', () => {
    // The whole point of the page: somebody with a Redmi Note has to find out
    // before paying, not after. Each of these must resolve to a plain "no".
    for (const query of ['Redmi Note 13', 'Infinix Hot 40', 'Tecno Spark 20', 'Galaxy A15']) {
      const first = findDevices(query)[0]
      expect(first, query).toBeDefined()
      expect(first.compatible, query).toBe(false)
    }
  })

  it('names no model twice', () => {
    const seen = ESIM_DEVICES.map(deviceLabel)
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('never claims a regional variant is unconditionally supported', () => {
    // `regional` is what stops the page overstating; a compatible entry without
    // it is a claim that every unit of that model has an eSIM.
    const flat = ESIM_DEVICES.filter((d) => d.compatible && !d.note).map(deviceLabel)
    expect(flat.every((name) => name.startsWith('Apple iPhone X'))).toBe(true)
  })

  it('counts each brand the way the chips report it', () => {
    for (const entry of DEVICE_BRANDS) {
      const models = ESIM_DEVICES.filter((d) => d.brand === entry.brand)
      expect(entry.total, entry.brand).toBe(models.length)
      expect(entry.supported, entry.brand).toBe(models.filter((d) => d.compatible).length)
    }
  })
})

describe('normalizeDeviceSearch', () => {
  it('collapses brand and family words onto one token', () => {
    expect(normalizeDeviceSearch('Apple iPhone 13')).toBe(normalizeDeviceSearch('iphone 13'))
    expect(normalizeDeviceSearch('Samsung Galaxy A55')).toBe(normalizeDeviceSearch('galaxy a55'))
    expect(normalizeDeviceSearch('Google Pixel 8')).toBe(normalizeDeviceSearch('pixel 8'))
  })

  it('reads "plus" and "+" as the same phone', () => {
    expect(normalizeDeviceSearch('iPhone 15 Plus')).toBe(normalizeDeviceSearch('iPhone 15+'))
  })
})

describe('iosMajorFromUA', () => {
  it('reads the major version out of a real iPhone user agent', () => {
    expect(
      iosMajorFromUA(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(18)
    expect(iosMajorFromUA('Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_5 like Mac OS X)')).toBe(16)
  })

  it('says nothing about anything that is not an iPhone', () => {
    // An iPad reports as Macintosh in desktop mode and a cellular iPad is a
    // different question anyway; guessing here would be guessing out loud.
    expect(iosMajorFromUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBeNull()
    expect(iosMajorFromUA('Mozilla/5.0 (Linux; Android 14; SM-A556E)')).toBeNull()
  })
})
