/**
 * What every request carries, whether or not the call site remembered.
 *
 * The language is the whole subject here. It decides which of three correct
 * answers the API returns, and getting it into the *address* rather than only
 * into a header is what stops a shared cache in Tashkent from handing a Russian
 * visitor the Uzbek catalogue — Cloudflare keys on the URL and honours `Vary`
 * only for `Accept-Encoding`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'

import { api, setApiLanguage } from './api'

/** The config as it left the interceptors, captured at the transport layer. */
let sent: InternalAxiosRequestConfig

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    length: 0, key: () => null, getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {},
  })
  api.defaults.adapter = async (config) => {
    sent = config as InternalAxiosRequestConfig
    return { data: [], status: 200, statusText: 'OK', headers: {}, config }
  }
  setApiLanguage('uz')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const params = () => (sent.params ?? {}) as Record<string, unknown>

describe('the language on every request', () => {
  it('rides in the header, always', async () => {
    setApiLanguage('ru')
    await api.get('/auth/me')
    expect(sent.headers['Accept-Language']).toBe('ru')
  })

  it('rides in the query too, for the catalogue', async () => {
    await api.get('/countries')
    expect(params().lang).toBe('uz')

    setApiLanguage('ru')
    await api.get('/countries')
    expect(params().lang).toBe('ru')
  })

  it('is stripped to the language, not the locale', async () => {
    // i18next stores "ru-RU" happily; the API knows three languages.
    setApiLanguage('ru-RU')
    await api.get('/regions')
    expect(params().lang).toBe('ru')
  })

  it('leaves a private address alone', async () => {
    // Nothing caches these, so a parameter here would only be noise in the log
    // — and this is also the test that the public list has not quietly grown to
    // include something that identifies a person.
    for (const url of ['/auth/me', '/account/esims', '/checkout/quote']) {
      await api.get(url)
      expect(params().lang, url).toBeUndefined()
    }
  })

  it('keeps whatever the call site already asked for', async () => {
    await api.get('/countries', { params: { limit: 400 } })
    expect(params()).toEqual({ limit: 400, lang: 'uz' })
  })
})
