import { describe, expect, it } from 'vitest'
import { hours, perDayUzs, som, totalUzs } from './money'

const RATE = 12_500

describe('totalUzs', () => {
  it('999 ga yaxlitlaydi -- undiriladigan summa aynan shu', () => {
    expect(totalUzs(3.99, RATE)).toBe(49_999)
  })
})

describe('perDayUzs', () => {
  it('kunlik ulush jamidan chiqadi', () => {
    expect(perDayUzs(49_999, 7)).toBe(7_100)
  })

  it('kunlikni 999 ga yaxlitlamaydi', () => {
    // Har bir kunni alohida "charm" qilish jami bilan to'g'ri kelmasdi.
    expect(perDayUzs(49_999, 7) % 1000).not.toBe(999)
  })

  it('juda arzon tarifda ham nolga tushmaydi', () => {
    expect(perDayUzs(1_500, 30)).toBe(100)
  })

  it('nol kunda yiqilmaydi', () => {
    expect(perDayUzs(49_999, 0)).toBe(50_000)
  })
})

describe('som', () => {
  it('mingliklarni uzilmaydigan bo‘shliq bilan ajratadi', () => {
    expect(som(49_999)).toBe('49\u00a0999')
    expect(som(1_032_000)).toBe('1\u00a0032\u00a0000')
    expect(som(999)).toBe('999')
  })
})

describe('hours', () => {
  it('katta sonni butunga yaxlitlaydi', () => {
    // "3.9 soat" taxminiy songa haddan ortiq aniqlik va'da qiladi.
    expect(hours(3.9)).toBe('~4')
  })

  it('kichik sonda kasrni vergul bilan yozadi', () => {
    expect(hours(1.5)).toBe('1,5')
  })

  it('nolni ham ko‘rsatadi', () => {
    expect(hours(0)).toBe('0')
  })
})
