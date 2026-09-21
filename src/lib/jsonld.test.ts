import { describe, expect, it } from 'vitest'

import { destinationLd, jsonLdText } from './structured-data'

/* The values in a JSON-LD block are catalogue text — a country name, a
   description — written in the admin and served by the API. They end up inside
   <script type="application/ld+json">, where the parser stops at the first
   </script> whatever quotes surround it. */
describe('JSON-LD serialisation', () => {
  it('cannot be ended early by a value containing a closing tag', () => {
    const out = jsonLdText({ name: '</script><img src=x onerror=alert(1)>' })
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<img')
    // Still the same string to a JSON parser.
    expect(JSON.parse(out).name).toBe('</script><img src=x onerror=alert(1)>')
  })

  it('escapes every < , not only the one that closes a tag', () => {
    const out = jsonLdText({ name: 'a < b' })
    expect(out).toContain('\\u003c')
    expect(out).not.toContain('<')
    expect(JSON.parse(out).name).toBe('a < b')
  })

  it('escapes the separators that are legal JSON and illegal JavaScript', () => {
    const out = jsonLdText({ name: 'a b c' })
    expect(out).not.toContain(' ')
    expect(out).not.toContain(' ')
    expect(JSON.parse(out).name).toBe('a b c')
  })

  it('leaves ordinary catalogue text alone', () => {
    const out = jsonLdText({ name: "Turkiya — eSIM, $1.00 dan" })
    expect(JSON.parse(out).name).toBe("Turkiya — eSIM, $1.00 dan")
  })
})

/* An AggregateOffer is what a shopping agent compares destinations on. It used
   to be built from the LIST endpoint, which returns only a starting price — so
   a destination with seven plans from $1.00 to $25.00 published
   "offerCount: 1, $1.00 to $1.00" beside a description on the same page saying
   "7 tariffs from $1.00". The page contradicted itself in its own head. */
describe('a destination’s aggregate offer', () => {
  const offers = [
    { name: '1 GB · 7 kun', price: 1, currency: 'USD' },
    { name: '10 GB · 30 kun', price: 12.99, currency: 'USD' },
    { name: 'Unlimited · 30 kun', price: 25, currency: 'USD' },
  ]

  it('spans every plan on sale, not only the cheapest', () => {
    const ld = destinationLd('Turkiya uchun eSIM', 'desc', '/destinations/turkey', 'uz', offers)
    const aggregate = (ld as { offers: Record<string, unknown> }).offers
    expect(aggregate.offerCount).toBe(3)
    expect(aggregate.lowPrice).toBe('1.00')
    expect(aggregate.highPrice).toBe('25.00')
  })

  it('ignores a plan with no real price rather than publishing "from $0"', () => {
    const ld = destinationLd('X', 'desc', '/destinations/x', 'uz', [
      ...offers,
      { name: 'broken', price: 0, currency: 'USD' },
      { name: 'also broken', price: Number.NaN, currency: 'USD' },
    ])
    const aggregate = (ld as { offers: Record<string, unknown> }).offers
    expect(aggregate.offerCount).toBe(3)
    expect(aggregate.lowPrice).toBe('1.00')
  })

  it('publishes nothing at all when there is nothing to sell', () => {
    expect(destinationLd('X', 'desc', '/destinations/x', 'uz', [])).toBeNull()
  })
})
