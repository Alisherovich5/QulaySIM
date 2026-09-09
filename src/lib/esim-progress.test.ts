import { describe, expect, it } from 'vitest'
import { hasNotStarted } from './esim-progress'

const esim = (over: Partial<Parameters<typeof hasNotStarted>[0]> = {}) => ({
  status: 'active',
  data_used_mb: 0,
  data_total_mb: 3072,
  ...over,
})

describe('hasNotStarted', () => {
  it('bir megabayt ham "hali boshlanmagan" hisoblanadi', () => {
    // Shikoyat qilgan mijozning aynan holati: BAA tarifi, 3 GB, 1 MB.
    // `used === 0` deb yozilganda izoh unga ko'rinmagan edi.
    expect(hasNotStarted(esim({ data_used_mb: 1 }))).toBe(true)
  })

  it('aniq nol ham', () => {
    expect(hasNotStarted(esim({ data_used_mb: 0 }))).toBe(true)
  })

  it('haqiqiy sarfni yashirmaydi', () => {
    expect(hasNotStarted(esim({ data_used_mb: 10 }))).toBe(false)
    expect(hasNotStarted(esim({ data_used_mb: 2581 }))).toBe(false)
  })

  it('o‘rnatilmagan eSIMga tegishli emas', () => {
    // Unga boshqa izoh chiqadi: "yetib borgach o'rnating". Ikkitasi birga
    // chiqsa, bitta kartada bir-biriga qarama-qarshi ikki gap turardi.
    expect(hasNotStarted(esim({ status: 'pending', data_used_mb: 0 }))).toBe(false)
  })

  it('cheksiz tarifda ko‘rsatilmaydi', () => {
    // Cheksizda "qolgan hajm" degan tushuncha yo'q, ya'ni izohning ma'nosi
    // ham yo'q.
    expect(hasNotStarted(esim({ data_total_mb: 0, data_used_mb: 0 }))).toBe(false)
  })

  it('tugagan tarifda ham to‘g‘ri ishlaydi', () => {
    // Ta'minotchi tugaganda jamidan bitta ko'p qaytaradi.
    expect(hasNotStarted(esim({ status: 'expired', data_used_mb: 3073 }))).toBe(false)
  })
})
