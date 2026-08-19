/**
 * The belts that keep a lossy network from emptying a page.
 *
 * Each test here is one half of a rule that has to hold in both directions: the
 * catalogue is retried and remembered, and everything that can charge money or
 * identify a person is not. Getting the second half wrong is worse than having
 * no belts at all, so it is tested as explicitly as the first.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { STALE_EVENT, installResilience, isPublicRead, isTransient, snapshot } from './resilient'

const config = (url: string, method = 'get') =>
  ({ url, method, headers: {} }) as unknown as InternalAxiosRequestConfig

/** A localStorage that behaves like the real one, including its quota error. */
function fakeStorage(limit = Infinity) {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (map.size >= limit && !map.has(k)) {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }
      map.set(k, v)
    },
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    _map: map,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', fakeStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('what is eligible', () => {
  it('covers the public catalogue reads and nothing else', () => {
    for (const url of ['/countries', '/countries/turkey', '/regions', '/plans/12', '/currency', '/content/faq']) {
      expect(isPublicRead(config(url)), url).toBe(true)
    }
  })

  it('never covers auth, account, checkout, or a write', () => {
    // A repeated checkout charges somebody twice and a cached /auth/me answers
    // "who is signed in" from disk. Both are the reason this list is a list.
    for (const url of ['/auth/me', '/auth/refresh', '/account/esims', '/checkout/quote', '/checkout/topup']) {
      expect(isPublicRead(config(url)), url).toBe(false)
    }
    expect(isPublicRead(config('/countries', 'post'))).toBe(false)
    // A prefix must match a segment, not a spelling: /countriesX is not ours.
    expect(isPublicRead(config('/countriesX'))).toBe(false)
  })

  it('retries what might succeed and accepts what will not', () => {
    const withStatus = (status?: number) => {
      const error = new AxiosError('failed')
      if (status) error.response = { status } as never
      return error
    }
    expect(isTransient(withStatus())).toBe(true) // nothing came back
    expect(isTransient(withStatus(503))).toBe(true)
    expect(isTransient(withStatus(429))).toBe(true)
    expect(isTransient(withStatus(404))).toBe(false) // an answer, not a failure
    expect(isTransient(withStatus(422))).toBe(false)
    const cancelled = new AxiosError('cancelled')
    cancelled.code = 'ERR_CANCELED'
    expect(isTransient(cancelled)).toBe(false) // the page navigated away
  })
})

describe('retry and last-good, end to end', () => {
  /** An axios instance whose transport fails the first `failures` attempts. */
  function instance(failures: number, payload: unknown = [{ slug: 'turkey' }]) {
    let attempts = 0
    const client = axios.create({ baseURL: '/api' })
    client.defaults.adapter = async (cfg) => {
      attempts += 1
      if (attempts <= failures) throw new AxiosError('Network Error', 'ERR_NETWORK', cfg)
      return { data: payload, status: 200, statusText: 'OK', headers: {}, config: cfg }
    }
    installResilience(client, () => 'uz')
    return { client, attempts: () => attempts }
  }

  it('a dropped request is retried, not reported', async () => {
    // Measured on the visitor's own link: 40% packet loss. One lost packet is
    // not an error, and this is the difference between 207 countries and none.
    const { client, attempts } = instance(2)
    const response = await client.get('/countries')
    expect(response.data).toEqual([{ slug: 'turkey' }])
    expect(attempts()).toBe(3)
  })

  it('gives up after three attempts rather than hammering a dead network', async () => {
    const { client, attempts } = instance(99)
    await expect(client.get('/countries')).rejects.toBeInstanceOf(AxiosError)
    expect(attempts()).toBe(3)
  })

  it('a write is never retried', async () => {
    const { client, attempts } = instance(1)
    await expect(client.post('/checkout/order', {})).rejects.toBeInstanceOf(AxiosError)
    expect(attempts()).toBe(1)
  })

  it('falls back to the last answer that arrived, and says so', async () => {
    const good = instance(0, [{ slug: 'georgia' }])
    await good.client.get('/countries')

    const events: number[] = []
    vi.stubGlobal('window', {
      dispatchEvent: (event: { detail?: { age: number } }) => events.push(event.detail?.age ?? -1),
    })
    vi.stubGlobal('CustomEvent', class {
      type: string
      detail: unknown
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type
        this.detail = init?.detail
      }
    })

    const dead = instance(99)
    const response = await dead.client.get('/countries')
    expect(response.data).toEqual([{ slug: 'georgia' }])
    expect(response.statusText).toBe('stale')
    expect(events).toHaveLength(1)
    expect(STALE_EVENT).toBe('qs:stale-data')
  })

  it('keeps each language in its own slot', async () => {
    // The API translates country names, so one URL has three right answers.
    // Serving the Uzbek catalogue to a Russian visitor is a wrong answer that
    // looks like a working page.
    const uz = axios.create({ baseURL: '/api' })
    uz.defaults.adapter = async (cfg) => ({
      data: ['Turkiya'], status: 200, statusText: 'OK', headers: {}, config: cfg,
    })
    installResilience(uz, () => 'uz')
    await uz.get('/countries')

    const ru = axios.create({ baseURL: '/api' })
    ru.defaults.adapter = async (cfg) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', cfg)
    }
    installResilience(ru, () => 'ru')
    await expect(ru.get('/countries')).rejects.toBeInstanceOf(AxiosError)
  })

  it('a 404 is passed through, so a deleted page still 404s', async () => {
    const client = axios.create({ baseURL: '/api' })
    client.defaults.adapter = async (cfg) => {
      const error = new AxiosError('Not Found', 'ERR_BAD_REQUEST', cfg)
      error.response = { status: 404, data: {}, statusText: '', headers: {}, config: cfg } as never
      throw error
    }
    installResilience(client, () => 'uz')
    await expect(client.get('/countries/atlantis')).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

describe('the store', () => {
  it('forgets an entry older than a week', () => {
    snapshot.put('qs:snap:1:uz:/countries', [1])
    const raw = JSON.parse(localStorage.getItem('qs:snap:1:uz:/countries')!)
    raw.t = Date.now() - 8 * 24 * 60 * 60 * 1000
    localStorage.setItem('qs:snap:1:uz:/countries', JSON.stringify(raw))
    expect(snapshot.get('qs:snap:1:uz:/countries')).toBeNull()
  })

  it('survives a full disk instead of failing the request', () => {
    // Private windows and iOS webviews both throw here. Losing the belt is
    // acceptable; losing the response because of it is not.
    vi.stubGlobal('localStorage', fakeStorage(0))
    expect(() => snapshot.put('qs:snap:1:uz:/countries', [1])) .not.toThrow()
    expect(snapshot.get('qs:snap:1:uz:/countries')).toBeNull()
  })

  it('ignores a value some other script corrupted', () => {
    localStorage.setItem('qs:snap:1:uz:/countries', 'not json')
    expect(snapshot.get('qs:snap:1:uz:/countries')).toBeNull()
  })

  it('prunes only its own keys', () => {
    localStorage.setItem('i18nextLng', 'uz')
    snapshot.put('qs:snap:1:uz:/countries', [1])
    snapshot.prune(true)
    expect(localStorage.getItem('i18nextLng')).toBe('uz')
  })
})
