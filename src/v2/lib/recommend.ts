/**
 * "Qaysi tarif menga to'g'ri keladi?" degan savolga javob.
 *
 * Hozirgi sayt bu savolni mijozning zimmasiga tashlaydi: Turkiya sahifasida
 * ettita tarif ustma-ust turadi, ikkitasi bir xil "3 GB" deb yozilgan va faqat
 * kichkina kulrang qatorda farq qiladi. Odam GB ni kunga bo'lib, o'ziga
 * yetadimi-yo'qmi deb o'zi hisoblashi kerak.
 *
 * Bu yerdagi hisob o'sha ishni o'z zimmasiga oladi: safar necha kun ekanini
 * so'raymiz, qolganini o'zimiz aytamiz.
 */
import type { Plan } from '../../lib/types'

/**
 * Kuniga o'rtacha sarf, MB.
 *
 * Sayohatchining odatiy kuni: xarita, yozishmalar, bir-ikki marta lentani
 * aylantirish, kechqurun bitta video qo'ng'iroq. Bu raqam ATAYLAB saxiy --
 * kam chiqib qolgan tarif mijozni chet elda internetsiz qoldiradi, ortiqcha
 * chiqib qolgani esa bir-ikki dollar. Ikkovining bahosi teng emas.
 */
export const MB_PER_DAY = 400

/** Bir soatlik sarf, MB. Ekranda "yetadimi?" ni odam tilida aytish uchun. */
export const HOURLY_MB = {
  map: 6,
  chat: 3,
  social: 110,
  video: 350,
  call: 200,
} as const

export interface Choice {
  /** Tavsiya etilgan tarif. */
  best: Plan
  /** Undan arzoni va qimmatrog'i -- "kamroq / ko'proq" tugmalari uchun. */
  cheaper: Plan | null
  dearer: Plan | null
  /** Safar uchun kerak bo'ladigan taxminiy hajm, MB. */
  needMb: number
  /** Tanlangan tarif safarni to'liq qoplaydimi. */
  covers: boolean
}

/** Tariflarni bir xil o'lchovga keltirib tartiblash: avval hajm, keyin narx. */
function order(plans: Plan[]): Plan[] {
  return [...plans].sort(
    (a, b) => effectiveMb(a) - effectiveMb(b) || a.price_usd - b.price_usd,
  )
}

/**
 * Cheksiz tariflarni ham bitta shkalaga qo'yish uchun.
 *
 * `data_amount_mb` cheksizda nol bo'ladi; nol deb olsak, cheksiz tarif eng
 * kichigiga aylanib, ro'yxatning boshiga chiqib qolardi.
 */
function effectiveMb(plan: Plan): number {
  return plan.is_unlimited ? Number.MAX_SAFE_INTEGER : plan.data_amount_mb
}

/**
 * Safar uzunligiga qarab tarif tanlash.
 *
 * Ikki shart bor va ular teng emas: MUDDAT qat'iy (7 kunlik tarif 10 kunlik
 * safarni qoplamaydi, qancha GB bo'lishidan qat'i nazar), HAJM esa taxminiy.
 * Shuning uchun avval muddat bo'yicha filtrlanadi, keyin hajm bo'yicha
 * tanlanadi.
 */
export function chooseForTrip(plans: Plan[], days: number): Choice | null {
  const priced = order(plans.filter((p) => p.price_usd > 0))
  if (priced.length === 0) return null

  const needMb = Math.max(1, days) * MB_PER_DAY
  const longEnough = priced.filter((p) => p.validity_days >= days)

  // Muddati yetadigan tariflar orasidan hajmi yetadigan eng arzoni. Bittasi
  // ham yetmasa -- eng kattasi, va `covers` yolg'on bo'lib qaytadi, ya'ni
  // sahifa buni yashirmasdan aytadi.
  const pool = longEnough.length > 0 ? longEnough : priced
  const enough = pool.filter((p) => effectiveMb(p) >= needMb)
  const best = enough.length > 0 ? enough[0] : pool[pool.length - 1]

  // Qo'shni tarif emas, HAJMI BOSHQACHA eng yaqini. Turkiyada ikkita "3 GB"
  // bor (15 va 30 kunlik), va oddiy qo'shni olinsa tugmada "Ko'proq · 3 GB"
  // deb turardi -- tavsiyaning o'zi bilan bir xil. "Ko'proq" degan tugma
  // ko'proq narsa bermasa, u tugma emas, chalg'itish.
  const mine = effectiveMb(best)
  const cheaper = [...pool].reverse().find((p) => effectiveMb(p) < mine) ?? null
  const dearer = pool.find((p) => effectiveMb(p) > mine) ?? null

  return {
    best,
    cheaper,
    dearer,
    needMb,
    covers: best.validity_days >= days && effectiveMb(best) >= needMb,
  }
}

export interface Allowance {
  /** Kuniga necha MB tegadi. */
  perDayMb: number
  /** O'sha hajm nimaga yetadi -- odam tilida, kuniga. */
  lines: { kind: keyof typeof HOURLY_MB; hours: number }[]
}

/**
 * "3 GB menga yetadimi?" -- eng ko'p beriladigan savol, va hozirgi saytda
 * javobi yo'q. GB odamga hech narsa demaydi; "kuniga 2 soat Instagram" deydi.
 */
export function explainAllowance(plan: Plan, days: number): Allowance | null {
  if (plan.is_unlimited) return null
  const span = Math.max(1, Math.min(days, plan.validity_days))
  const perDayMb = Math.round(plan.data_amount_mb / span)

  // Kunni odatiy taqsimlash: yozishmalar va xarita doim bor, qolgani ortdan.
  // Nisbatlar taxminiy, lekin haqiqiy sarfga yaqin.
  const chat = 1
  const map = 1.5
  const usedByBasics = chat * HOURLY_MB.chat + map * HOURLY_MB.map
  const left = Math.max(0, perDayMb - usedByBasics)

  return {
    perDayMb,
    lines: [
      { kind: 'chat', hours: chat },
      { kind: 'map', hours: map },
      { kind: 'social', hours: round1(left / HOURLY_MB.social) },
    ],
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Tarif safarning necha kunini haqiqatda qoplaydi.
 *
 * Kunlik narx shunga bo'linadi: 7 kunlik tarifni 30 kunga bo'lsak, kunlik
 * narx haqiqiydan to'rt barobar arzon ko'rinardi.
 */
export function effectiveDays(plan: Plan, days: number): number {
  return Math.max(1, Math.min(days, plan.validity_days))
}
