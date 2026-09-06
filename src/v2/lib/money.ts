/**
 * Kunlik narxni ekranga chiqarish.
 *
 * Jami narx `charmUzs` orqali 999 ga yaxlitlanadi -- bu haqiqiy, undirilgan
 * summa. Kunlik narx esa undan KELIB CHIQADI, aks holda ikkalasi bir-biriga
 * to'g'ri kelmaydi: $3.99 ni kunga bo'lib, keyin har birini alohida 999 ga
 * yaxlitlasak, 7 x 6 999 = 48 993 chiqadi, jami esa 49 999 deb turadi.
 * Mijoz buni ko'radi va saytga ishonchi qoladi.
 *
 * Shuning uchun: jami -- aniq, kunlik -- undan bo'lingan va yuzlikka
 * yaxlitlangan taxminiy son, va ekranda "~" bilan yoziladi.
 */
import { charmUzs } from '../../lib/charm'

export function totalUzs(usd: number, rate: number): number {
  return charmUzs(usd * rate)
}

/**
 * Kunlik ulush. Yuzlikka yaxlitlanadi, chunki "7 125 so'm" aniqlik va'da
 * qiladi -- aslida bu bo'lingan son.
 */
export function perDayUzs(total: number, days: number): number {
  const span = Math.max(1, days)
  return Math.max(100, Math.round(total / span / 100) * 100)
}

/** 49999 -> "49 999". Ajratmasdan uzun so'm summasini o'qib bo'lmaydi.
 *
 *  Intl ishlatilmadi: `uz` uchun ajratuvchi Chrome'da bir xil, Node'da
 *  boshqacha chiqdi (referal panelidagi foizda ham shu bo'ldi). Bu yerda esa
 *  ajratuvchi -- uzilmaydigan bo'shliq, ya'ni "49" bilan "999" hech qachon
 *  ikki qatorga bo'linmaydi.
 */
export function som(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
}


/**
 * Soatni o'zbekcha yozish: "3.9" emas, "~4". Bu son allaqachon taxminiy --
 * o'ndan bir aniqlik va'da qilish uni haqiqiydan aniqroq ko'rsatadi. Va kasr
 * qolganda ajratuvchi vergul bo'ladi, chunki matn o'zbekcha.
 */
export function hours(value: number): string {
  if (value >= 2) return `~${Math.round(value)}`
  return String(Math.round(value * 10) / 10).replace('.', ',')
}
