export interface BrandCount {
  brand: string
  total: number
  supported: number
}

export interface DeviceSummary {
  heading: string
  lead: string
  /** "Apple — 38 modeldan 30 tasi", ready to print. */
  rows: string[]
  noneHeading: string
  noneText: string
  checkHeading: string
  checkSteps: string[]
}

type Lang = 'uz' | 'ru' | 'en'

const D = {
  uz: {
    heading: 'Qaysi telefonlar eSIM’ni qo‘llab-quvvatlaydi?',
    lead: (sup: number, total: number, brands: number) =>
      `Bizda ${brands} ta brendning ${total} ta modeli tekshirilgan: ${sup} tasida eSIM bor, qolganida yo‘q. eSIM — brendning emas, aynan modelning xususiyati: bitta Galaxy A seriyasining bir modelida bor, qo‘shnisida yo‘q.`,
    row: (brand: string, sup: number, total: number) => `${brand} — ${total} modeldan ${sup} tasida eSIM bor`,
    rowNone: (brand: string, total: number) => `${brand} — tekshirilgan ${total} modelning hech birida eSIM yo‘q`,
    noneHeading: 'eSIM yo‘q brendlar',
    noneText: (list: string) =>
      `${list} — bu brendlarning bizdagi ro‘yxatdagi modellarida eSIM umuman yo‘q. Bu O‘zbekistonda eng ko‘p tarqalgan arzon telefonlar, shuning uchun buni to‘lovdan oldin bilib olish kerak.`,
    checkHeading: 'O‘z telefoningizni qanday tekshirasiz',
    checkSteps: [
      'Terish oynasiga *#06# yozing. Ochilgan oynada IMEI bilan birga EID raqami ko‘rinsa — telefonda eSIM bor.',
      'iPhone: Sozlamalar → Uyali aloqa. “eSIM qo‘shish” yoki “Tarif qo‘shish” yozuvi bo‘lsa, qo‘llab-quvvatlanadi.',
      'Android: Sozlamalar → Tarmoq va internet → SIM-kartalar. “eSIM yuklab olish” yoki “SIM qo‘shish” bo‘lsa, bor.',
      'Telefon operatorga bog‘lanmagan (unlocked) bo‘lishi ham kerak — shartnoma bilan olingan qulflangan telefon begona eSIM’ni qabul qilmaydi.',
    ],
  },
  ru: {
    heading: 'Какие телефоны поддерживают eSIM?',
    lead: (sup: number, total: number, brands: number) =>
      `У нас проверено ${total} моделей ${brands} брендов: в ${sup} есть eSIM, в остальных нет. eSIM — свойство конкретной модели, а не бренда: в одной модели Galaxy A он есть, в соседней нет.`,
    row: (brand: string, sup: number, total: number) => `${brand} — eSIM есть в ${sup} из ${total} моделей`,
    rowNone: (brand: string, total: number) => `${brand} — ни в одной из ${total} проверенных моделей eSIM нет`,
    noneHeading: 'Бренды без eSIM',
    noneText: (list: string) =>
      `${list} — ни в одной модели этих брендов из нашего списка eSIM нет. Это самые распространённые недорогие телефоны, поэтому проверить стоит до оплаты.`,
    checkHeading: 'Как проверить свой телефон',
    checkSteps: [
      'Наберите *#06#. Если рядом с IMEI показан номер EID — eSIM в телефоне есть.',
      'iPhone: Настройки → Сотовая связь. Есть пункт «Добавить eSIM» или «Добавить тариф» — поддерживается.',
      'Android: Настройки → Сеть и интернет → SIM-карты. Есть «Загрузить eSIM» или «Добавить SIM» — есть.',
      'Телефон должен быть не привязан к оператору: залоченный контрактный аппарат чужую eSIM не примет.',
    ],
  },
  en: {
    heading: 'Which phones support eSIM?',
    lead: (sup: number, total: number, brands: number) =>
      `We have checked ${total} models across ${brands} brands: ${sup} have an eSIM and the rest do not. eSIM is a property of the exact model rather than of the brand — one Galaxy A model has it and the next one does not.`,
    row: (brand: string, sup: number, total: number) => `${brand} — ${sup} of ${total} models have an eSIM`,
    rowNone: (brand: string, total: number) => `${brand} — none of the ${total} models checked has an eSIM`,
    noneHeading: 'Brands with no eSIM',
    noneText: (list: string) =>
      `${list} — no model of these brands on our list has an eSIM. These are the common budget phones here, so it is worth checking before paying.`,
    checkHeading: 'How to check your own phone',
    checkSteps: [
      'Dial *#06#. If an EID number appears next to the IMEI, the phone has an eSIM.',
      'iPhone: Settings → Cellular. If there is “Add eSIM” or “Add Plan”, it is supported.',
      'Android: Settings → Network & internet → SIMs. If there is “Download a SIM” or “Add SIM”, it is there.',
      'The phone also has to be carrier-unlocked: a locked contract handset will not accept somebody else’s eSIM.',
    ],
  },
} as const

/**
 * The device section, counted rather than claimed.
 *
 * Every number here is read off the device table the /device-check page
 * searches, so the page cannot drift from the tool beside it, and nobody has to
 * remember to update a sentence when a model is added.
 */
export function deviceSummary(brands: readonly BrandCount[], lang: Lang): DeviceSummary {
  const d = D[lang] ?? D.uz
  const total = brands.reduce((n, b) => n + b.total, 0)
  const supported = brands.reduce((n, b) => n + b.supported, 0)
  const none = brands.filter((b) => b.supported === 0)

  return {
    heading: d.heading,
    lead: d.lead(supported, total, brands.length),
    rows: brands
      .filter((b) => b.supported > 0)
      .map((b) => d.row(b.brand, b.supported, b.total)),
    noneHeading: d.noneHeading,
    noneText: d.noneText(none.map((b) => b.brand).join(', ')),
    checkHeading: d.checkHeading,
    checkSteps: [...d.checkSteps],
  }
}
