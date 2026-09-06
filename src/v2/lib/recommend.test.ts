/**
 * Tarif tanlash -- pulga tegishli qaror, shuning uchun taxminга emas, testga
 * tayanadi. Turkiya sahifasidagi haqiqiy tariflar bilan tekshiriladi.
 */
import { describe, expect, it } from 'vitest'
import type { Plan } from '../../lib/types'
import { chooseForTrip, effectiveDays, explainAllowance } from './recommend'

function plan(over: Partial<Plan>): Plan {
  return {
    id: 1,
    scope: 'local',
    title: '',
    data_amount_mb: 1024,
    is_unlimited: false,
    data_label: '1 GB',
    validity_days: 7,
    price_usd: 1,
    price_note: '',
    network_type: '4G',
    supports_hotspot: true,
    is_popular: false,
    ...over,
  }
}

/** qulaysim.uz/api/countries/turkey dan olingan haqiqiy tariflar. */
const TURKEY: Plan[] = [
  plan({ id: 6, data_amount_mb: 1024, data_label: '1 GB', validity_days: 7, price_usd: 1.0 }),
  plan({ id: 7, data_amount_mb: 3072, data_label: '3 GB', validity_days: 15, price_usd: 3.99 }),
  plan({ id: 1085, data_amount_mb: 3072, data_label: '3 GB', validity_days: 30, price_usd: 4.2 }),
  plan({ id: 8, data_amount_mb: 5120, data_label: '5 GB', validity_days: 30, price_usd: 4.99 }),
  plan({ id: 9, data_amount_mb: 10240, data_label: '10 GB', validity_days: 30, price_usd: 7.5 }),
  plan({ id: 10, data_amount_mb: 20480, data_label: '20 GB', validity_days: 30, price_usd: 12.99 }),
  plan({ id: 11, data_amount_mb: 51200, data_label: '50 GB', validity_days: 30, price_usd: 25.0 }),
]

describe('chooseForTrip', () => {
  it('qisqa safarga eng kichik tarifni beradi', () => {
    // 3 kun × 400 MB = 1200 MB. 1 GB yetmaydi, 3 GB yetadi.
    expect(chooseForTrip(TURKEY, 3)?.best.data_label).toBe('3 GB')
  })

  it('muddat hajmdan ustun turadi', () => {
    // Kattaroq tarifning muddati qisqa. Muddat tekshirilmasa, hajm bo'yicha
    // saralash 5 GB/7 kunni tanlab, mijoz 13-kuni internetsiz qolardi.
    const shortButBig = [
      plan({ id: 1, data_amount_mb: 3072, data_label: '3 GB', validity_days: 30, price_usd: 4 }),
      plan({ id: 2, data_amount_mb: 5120, data_label: '5 GB', validity_days: 7, price_usd: 5 }),
    ]
    const choice = chooseForTrip(shortButBig, 20)

    expect(choice?.best.data_label).toBe('3 GB')
    expect(choice?.best.validity_days).toBe(30)
  })

  it('bir xil hajmdagi ikkita tarifdan arzonini oladi', () => {
    // Saytdagi eng chalkash joy: ikkita "3 GB", biri $3.99/15 kun, biri
    // $4.20/30 kun. 7 kunlik safarda ikkalasi ham yetadi, ya'ni tanlov faqat
    // narxga qoladi -- va odam buni o'zi taqqoslab o'tirmasligi kerak.
    const choice = chooseForTrip(TURKEY, 7)
    expect(choice?.best.data_label).toBe('3 GB')
    expect(choice?.best.price_usd).toBe(3.99)
  })

  it('uzoq safarda katta tarifga o‘tadi', () => {
    // 30 kun × 400 MB = 12 GB, ya'ni 10 GB yetmaydi.
    expect(chooseForTrip(TURKEY, 30)?.best.data_label).toBe('20 GB')
  })

  it('yonidagi arzon va qimmat variantlarni ko‘rsatadi', () => {
    const choice = chooseForTrip(TURKEY, 3)
    expect(choice?.cheaper?.data_label).toBe('1 GB')
    expect(choice?.dearer).not.toBeNull()
  })

  it('"ko‘proq" haqiqatan ko‘proq bo‘ladi', () => {
    // Turkiyada ikkita "3 GB" bor (15 va 30 kunlik). Oddiy qo'shni olinsa
    // tugmada "Ko'proq · 3 GB" deb turardi -- tavsiyaning o'zi bilan bir xil.
    const choice = chooseForTrip(TURKEY, 7)

    expect(choice?.best.data_label).toBe('3 GB')
    expect(choice?.dearer?.data_label).not.toBe('3 GB')
    expect(choice?.dearer?.data_amount_mb).toBeGreaterThan(3072)
    expect(choice?.cheaper?.data_amount_mb).toBeLessThan(3072)
  })

  it('hech narsa yetmaganda yashirmaydi', () => {
    const tiny = [plan({ data_amount_mb: 512, data_label: '512 MB', validity_days: 3 })]
    const choice = chooseForTrip(tiny, 30)
    expect(choice?.covers).toBe(false)
  })

  it('cheksiz tarif eng kichik bo‘lib qolmaydi', () => {
    // `data_amount_mb` cheksizda nol bo'ladi. Nol deb olinsa cheksiz tarif
    // ro'yxatning eng boshiga, ya'ni "eng kichik" o'ringa tushib qolardi --
    // va uzoq safarga aynan u kerak bo'lgan joyda tanlanmasdan qolardi.
    const withUnlimited = [
      plan({ id: 1, data_amount_mb: 1024, data_label: '1 GB', validity_days: 30, price_usd: 2 }),
      plan({ id: 99, is_unlimited: true, data_amount_mb: 0, data_label: 'Cheksiz', validity_days: 30, price_usd: 40 }),
    ]

    // 30 kun x 400 MB = 12 GB: 1 GB umuman yetmaydi, cheksiz yetadi.
    expect(chooseForTrip(withUnlimited, 30)?.best.data_label).toBe('Cheksiz')
    // Qisqa safarda esa arzoni tanlanadi.
    expect(chooseForTrip(withUnlimited, 2)?.best.data_label).toBe('1 GB')
  })

  it('narxsiz tariflarni hisobga olmaydi', () => {
    // Katalogda test yozuvlari uchraydi. Bepul tarif haqiqiy tarif bilan bir
    // xil hajmda bo'lsa, narx bo'yicha saralash uni birinchi o'ringa qo'yadi
    // va sahifada "0 so'm" chiqadi.
    const withFree = [
      plan({ id: 5, price_usd: 0, data_amount_mb: 3072, data_label: '3 GB', validity_days: 30 }),
      ...TURKEY,
    ]
    const choice = chooseForTrip(withFree, 7)

    expect(choice?.best.price_usd).toBe(3.99)
  })

  it('tarif yo‘q bo‘lsa null qaytaradi', () => {
    expect(chooseForTrip([], 5)).toBeNull()
  })
})

describe('explainAllowance', () => {
  it('GB ni kunlik hajmga aylantiradi', () => {
    // 3 GB, 5 kunlik safar -> kuniga ~614 MB.
    const a = explainAllowance(plan({ data_amount_mb: 3072, validity_days: 15 }), 5)
    expect(a?.perDayMb).toBe(614)
  })

  it('safar tarifdan uzun bo‘lsa tarif muddatiga bo‘ladi', () => {
    // 7 kunlik tarifni 30 kunga cho'zib bo'lmaydi; kunlik hajm 7 kunga hisoblanadi.
    const a = explainAllowance(plan({ data_amount_mb: 1024, validity_days: 7 }), 30)
    expect(a?.perDayMb).toBe(146)
  })

  it('cheksiz tarifda tushuntirish kerak emas', () => {
    expect(explainAllowance(plan({ is_unlimited: true }), 5)).toBeNull()
  })

  it('kichik tarifda ijtimoiy tarmoq soati manfiy bo‘lmaydi', () => {
    const a = explainAllowance(plan({ data_amount_mb: 10, validity_days: 30 }), 30)
    expect(a?.lines.find((l) => l.kind === 'social')?.hours).toBe(0)
  })
})

describe('effectiveDays', () => {
  it('safar tarifdan qisqa bo‘lsa safar kunlarini oladi', () => {
    expect(effectiveDays(plan({ validity_days: 15 }), 5)).toBe(5)
  })

  it('safar tarifdan uzun bo‘lsa tarif muddatini oladi', () => {
    // Aks holda kunlik narx haqiqiydan to'rt barobar arzon ko'rinardi.
    expect(effectiveDays(plan({ validity_days: 7 }), 30)).toBe(7)
  })

  it('nol kun bo‘lmaydi', () => {
    expect(effectiveDays(plan({ validity_days: 7 }), 0)).toBe(1)
  })
})
