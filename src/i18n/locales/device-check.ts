/**
 * Qurilma tekshiruvi sahifasining matnlari — alohida faylda.
 *
 * Uchta katta locale fayli hozir boshqa ishning ostida turgani uchun bu
 * matnlar shu yerda va `resources` ga qo'shib beriladi — `esim-status.ts`
 * bilan bir xil naqsh. Kalitlar `dc.` bilan boshlanadi, ya'ni asosiy
 * fayllardagi `device.` bloki bilan chalkashmaydi va u blok o'z joyida
 * qoladi: telefonda *#06# orqali tekshirish matnlari hamon o'sha yerda.
 *
 * Nega yangi matn kerak bo'ldi: sahifa tasdiqlangan dizaynga keltirildi va
 * undagi savol qisqaroq. "Telefoningiz eSIM'ni qo'llab-quvvatlaydimi?" —
 * to'g'ri, lekin ikki qatorga chiqadi va texnik yangraydi; "eSIM'ga
 * tayyormi?" xuddi shu savol, odam tilida.
 */
export const DEVICE_CHECK_COPY = {
  uz: {
    dc: {
      title: 'Telefoningiz eSIM’ga tayyormi?',
      lead: 'Modelni yozing yoki brendni tanlang.',
      placeholder: 'Telefon modelini yozing',
      check: 'Tekshirish',
      unknownModel: 'Modelingizni bilmaysizmi?',
      brandsLabel: 'Brendlar',
    },
  },
  ru: {
    dc: {
      title: 'Ваш телефон готов к eSIM?',
      lead: 'Введите модель или выберите бренд.',
      placeholder: 'Введите модель телефона',
      check: 'Проверить',
      unknownModel: 'Не знаете свою модель?',
      brandsLabel: 'Бренды',
    },
  },
  en: {
    dc: {
      title: 'Is your phone ready for eSIM?',
      lead: 'Type the model, or pick a brand.',
      placeholder: 'Type your phone model',
      check: 'Check',
      unknownModel: "Don't know your model?",
      brandsLabel: 'Brands',
    },
  },
} as const
