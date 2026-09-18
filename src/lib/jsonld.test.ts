import { describe, expect, it } from 'vitest'

import { jsonLdText } from './structured-data'

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
