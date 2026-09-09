/**
 * "Bu eSIM ishlatila boshlandimi?" degan savolga javob.
 *
 * Sodda ko'rinadi, lekin `used === 0` deb yozish yetmaydi. Shikoyat qilgan
 * mijozning hisobida 1 MB turgan edi: eSIM tarmoqqa ro'yxatdan o'tganda,
 * telefon fon xizmatlarini bir marta tekshirganda bir-ikki megabayt shundoq
 * ham ketadi. Ya'ni "nol" amalda nol bo'lmaydi, va shart qat'iy nolga
 * bog'lansa izoh aynan kerak bo'lgan odamga ko'rinmaydi.
 */

/**
 * Shu chegaradan pastda sarf "hali boshlanmagan" deb hisoblanadi.
 *
 * 10 MB -- eng kichik tarifning (1 GB) bir foizidan kamrog'i, ya'ni haqiqiy
 * sarfni yashirib qo'ymaydi; lekin tarmoqqa ulanish va bitta fon
 * yangilanishini qoplaydi. Raqam taxminiy va shunday bo'lishi ham kerak:
 * aniq chegara yo'q, mijozga esa aniq javob kerak.
 */
export const BARELY_USED_MB = 10

/**
 * Profil tirik, lekin hisob hali yurmagan holat.
 *
 * `pending` bu holatga kirmaydi: o'rnatilmagan eSIM boshqa gap va unga
 * boshqa izoh chiqadi ("yetib borgach o'rnating"). Cheksiz tarifda ham
 * ko'rsatilmaydi -- unda qolgan hajm degan tushuncha yo'q.
 */
export function hasNotStarted(esim: {
  status: string
  data_used_mb: number
  data_total_mb: number
}): boolean {
  if (esim.status === 'pending') return false
  if (esim.data_total_mb === 0) return false
  return esim.data_used_mb < BARELY_USED_MB
}
