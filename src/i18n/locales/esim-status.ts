/**
 * eSIM holati haqidagi izohlar — alohida faylda.
 *
 * Uchta katta locale fayli hozir boshqa ishning ostida turgani uchun bu
 * matnlar shu yerda va `resources` ga qo'shib beriladi. Kalitlar `esim.`
 * bilan boshlanadi, ya'ni asosiy fayllardagi `account.` bloki bilan
 * chalkashmaydi.
 *
 * Matnlar nima uchun kerak bo'lgani: mijoz "0 GB sarflangan" ni ko'rib
 * "sayt qolgan MB ni ko'rsatmayapti" deb yozdi. Raqam to'g'ri edi -- u
 * BAA tarifini O'zbekistonda turib o'rnatgan, ya'ni hech narsa
 * sarflanmagan. Sahifa buni AYTMAGANI uchun u yolg'on deb o'qildi.
 */
export const ESIM_STATUS_COPY = {
  uz: {
    esim: {
      // 3-band: nol sarf tushuntirilmasa, u buzuq raqamdek ko'rinadi.
      notStartedTitle: 'Hali internet sarflanmagan',
      notStartedBody:
        'Bu normal holat. Hisob shu davlatga yetib borib, telefon mahalliy tarmoqqa ulanganda boshlanadi.',
      // 2-band: raqam yonidagi vaqt.
      checkedAt: '{{time}} da yangilandi',
      checkedNever: 'hali tekshirilmagan',
      leftCaption: '{{amount}} qoldi',
      // 4-band: pul yonadigan joy.
      installWarnTitle: 'Yetib borgach o‘rnating',
      installWarnBody:
        'Tarif muddati eSIM o‘rnatilgan kundan boshlanadi — chiqishdan oldin o‘rnatsangiz, kunlar bekorga ketadi.',
    },
  },
  ru: {
    esim: {
      notStartedTitle: 'Интернет пока не расходовался',
      notStartedBody:
        'Это нормально. Счётчик начнётся, когда вы приедете в страну и телефон подключится к местной сети.',
      checkedAt: 'обновлено в {{time}}',
      checkedNever: 'ещё не проверялось',
      leftCaption: 'осталось {{amount}}',
      installWarnTitle: 'Устанавливайте по прибытии',
      installWarnBody:
        'Срок тарифа начинается со дня установки eSIM — если установить до выезда, дни уйдут впустую.',
    },
  },
  en: {
    esim: {
      notStartedTitle: 'No data used yet',
      notStartedBody:
        'That is normal. The counter starts when you arrive and your phone joins a local network.',
      checkedAt: 'updated at {{time}}',
      checkedNever: 'not checked yet',
      leftCaption: '{{amount}} left',
      installWarnTitle: 'Install on arrival',
      installWarnBody:
        'The plan’s validity starts the day the eSIM is installed — installing before you fly burns days you have paid for.',
    },
  },
} as const
