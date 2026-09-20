import { COUNTRY_NETWORKS, type CountryNetwork } from './country-networks.generated'

export type NetworkLang = 'uz' | 'ru' | 'en'

export interface NetworkCopy {
  heading: string
  lead: string
  operators: CountryNetwork[]
  /** The two or three things that are true of *this* country, not of eSIMs. */
  notes: string[]
}

const T = {
  uz: {
    heading: (c: string) => `${c}da qaysi tarmoqlarda ishlaydi`,
    one: (c: string, op: string) => `${c}da eSIM ${op} tarmog‘iga ulanadi.`,
    many: (c: string, list: string, n: number) =>
      `${c}da eSIM ${n} ta operator tarmog‘ida ishlaydi: ${list}.`,
    picks: 'Telefon qaysi biriga ulanishni o‘zi tanlaydi — signal kuchsizlanganda ikkinchisiga o‘tadi, siz hech narsa qilmaysiz.',
    fiveG: (list: string) => `5G shu tarmoqlarda mavjud: ${list}. Telefoningiz 5G’ni qo‘llab-quvvatlasa, o‘zi ulanadi.`,
    fourG: 'Bu yo‘nalishda tarmoq 4G/LTE — video va xaritaga yetarli, lekin 5G yo‘q.',
    noSim: `Mahalliy SIM sotib olish, pasport ro‘yxatidan o‘tish va navbatda turish kerak emas: raqamingiz o‘zingizda qoladi, internet esa shu tarmoqlardan keladi.`,
  },
  ru: {
    heading: (c: string) => `В каких сетях работает в ${c}`,
    one: (c: string, op: string) => `В ${c} eSIM подключается к сети ${op}.`,
    many: (c: string, list: string, n: number) =>
      `В ${c} eSIM работает в сетях ${n} операторов: ${list}.`,
    picks: 'Телефон сам выбирает, к какой подключиться, и переключается на другую при слабом сигнале — от вас ничего не требуется.',
    fiveG: (list: string) => `5G доступен в сетях: ${list}. Если телефон поддерживает 5G, он подключится сам.`,
    fourG: 'На этом направлении сеть 4G/LTE — хватает для видео и карт, но 5G нет.',
    noSim: 'Не нужно покупать местную SIM, регистрировать паспорт и стоять в очереди: ваш номер остаётся при вас, а интернет идёт из этих сетей.',
  },
  en: {
    heading: (c: string) => `Which networks it uses in ${c}`,
    one: (c: string, op: string) => `In ${c} the eSIM connects to ${op}.`,
    many: (c: string, list: string, n: number) =>
      `In ${c} the eSIM works on ${n} operator networks: ${list}.`,
    picks: 'The phone picks which one to use and moves to another when the signal drops — there is nothing for you to set.',
    fiveG: (list: string) => `5G is available on: ${list}. If your phone supports 5G it will connect on its own.`,
    fourG: 'This destination is 4G/LTE — enough for video and maps, but there is no 5G.',
    noSim: 'No local SIM to buy, no passport registration and no queue: you keep your own number and the data comes from these networks.',
  },
} as const

/** Everything this country's page can say that no other country's page can. */
export function networkCopy(
  iso2: string | null | undefined,
  countryName: string,
  lang: NetworkLang,
): NetworkCopy | null {
  const operators = COUNTRY_NETWORKS[(iso2 || '').toUpperCase()]
  if (!operators?.length) return null
  const t = T[lang] ?? T.uz

  const names = operators.map((o) => o.name)
  const list = names.join(', ')
  const lead =
    operators.length === 1 ? t.one(countryName, names[0]!) : t.many(countryName, list, operators.length)

  const fiveG = operators.filter((o) => o.network.includes('5G')).map((o) => o.name)
  const notes: string[] = []
  if (operators.length > 1) notes.push(t.picks)
  notes.push(fiveG.length ? t.fiveG(fiveG.join(', ')) : t.fourG)
  notes.push(t.noSim)

  return { heading: t.heading(countryName), lead, operators, notes }
}

const F = {
  uz: {
    q1: (c: string) => `${c}da eSIM qaysi operatorlarda ishlaydi?`,
    q2: (c: string) => `${c}da 5G bormi?`,
    q3: (c: string) => `${c} uchun qancha internet kerak?`,
    q4: (c: string) => `${c}da mahalliy SIM sotib olish kerakmi?`,
    q5: 'Tarif necha kun amal qiladi?',
    a2yes: (c: string, list: string) => `Ha. ${c}da 5G quyidagi tarmoqlarda ishlaydi: ${list}. Telefoningiz 5G’ni qo‘llab-quvvatlamasa, 4G/LTE’da ishlaydi.`,
    a2no: (c: string) => `${c}da bu eSIM 4G/LTE tarmog‘ida ishlaydi. Xarita, messenjer va video uchun yetarli.`,
    a3: (lo: string, hi: string) =>
      `Bir haftalik sayohatda ko‘pchilikka ${lo} yetadi: xarita, messenjer va ijtimoiy tarmoq. Ko‘p video ko‘rsangiz yoki internetni noutbukka ulashsangiz, ${hi} oling.`,
    a4: 'Yo‘q. eSIM onlayn olinadi va telefonga QR orqali o‘rnatiladi — do‘kon, navbat va pasport ro‘yxatidan o‘tish kerak emas. O‘z raqamingiz telefonda qoladi, faqat internet yangi tarifdan keladi.',
    a5: (lo: number, hi: number) =>
      lo === hi
        ? `${lo} kun. Hisob birinchi marta tarmoqqa ulanganda boshlanadi, sotib olganda emas.`
        : `${lo} kundan ${hi} kungacha — tarifga qarab. Hisob birinchi marta tarmoqqa ulanganda boshlanadi, sotib olganda emas.`,
  },
  ru: {
    q1: (c: string) => `В сетях каких операторов eSIM работает в ${c}?`,
    q2: (c: string) => `Есть ли 5G в ${c}?`,
    q3: (c: string) => `Сколько интернета нужно для ${c}?`,
    q4: (c: string) => `Нужно ли покупать местную SIM в ${c}?`,
    q5: 'Сколько дней действует тариф?',
    a2yes: (c: string, list: string) => `Да. В ${c} 5G работает в сетях: ${list}. Если телефон не поддерживает 5G, он будет работать в 4G/LTE.`,
    a2no: (c: string) => `В ${c} эта eSIM работает в сети 4G/LTE. Для карт, мессенджеров и видео этого достаточно.`,
    a3: (lo: string, hi: string) =>
      `На неделю большинству хватает ${lo}: карты, мессенджеры и соцсети. Если много видео или раздаёте интернет на ноутбук — берите ${hi}.`,
    a4: 'Нет. eSIM покупается онлайн и устанавливается по QR-коду — без магазина, очереди и регистрации паспорта. Ваш номер остаётся в телефоне, из нового тарифа идёт только интернет.',
    a5: (lo: number, hi: number) =>
      lo === hi
        ? `${lo} дней. Отсчёт начинается при первом подключении к сети, а не в момент покупки.`
        : `От ${lo} до ${hi} дней — в зависимости от тарифа. Отсчёт начинается при первом подключении к сети, а не в момент покупки.`,
  },
  en: {
    q1: (c: string) => `Which operators does the eSIM use in ${c}?`,
    q2: (c: string) => `Is there 5G in ${c}?`,
    q3: (c: string) => `How much data do I need for ${c}?`,
    q4: (c: string) => `Do I need to buy a local SIM in ${c}?`,
    q5: 'How long is a plan valid for?',
    a2yes: (c: string, list: string) => `Yes. In ${c} 5G runs on: ${list}. If your phone has no 5G it falls back to 4G/LTE.`,
    a2no: (c: string) => `In ${c} this eSIM runs on 4G/LTE, which is enough for maps, messaging and video.`,
    a3: (lo: string, hi: string) =>
      `For a week most people are fine on ${lo}: maps, messaging and social. Take ${hi} if you watch a lot of video or tether a laptop.`,
    a4: 'No. The eSIM is bought online and installed from a QR code — no shop, no queue, no passport registration. Your own number stays in the phone; only the data comes from the new plan.',
    a5: (lo: number, hi: number) =>
      lo === hi
        ? `${lo} days. The clock starts the first time it connects to a network, not when you buy it.`
        : `Between ${lo} and ${hi} days depending on the plan. The clock starts the first time it connects to a network, not when you buy it.`,
  },
} as const

const gb = (mb: number) => `${Math.round(mb / 1024)} GB`

/**
 * A country's own questions, answered from its own numbers.
 *
 * Every answer here is derived: the operators from the wholesaler, the sizes
 * and durations from the plans this destination actually sells. Nothing is
 * written per country by hand, so nothing can be wrong about one country while
 * being right about another.
 */
export function countryFaq(
  iso2: string | null | undefined,
  countryName: string,
  facts: { sizesMb: readonly number[]; minDays: number; maxDays: number } | null | undefined,
  lang: NetworkLang,
): { q: string; a: string }[] {
  const operators = COUNTRY_NETWORKS[(iso2 || '').toUpperCase()]
  const f = F[lang] ?? F.uz
  const t = T[lang] ?? T.uz
  const out: { q: string; a: string }[] = []

  if (operators?.length) {
    const names = operators.map((o) => o.name)
    out.push({
      q: f.q1(countryName),
      a:
        operators.length === 1
          ? t.one(countryName, names[0]!)
          : t.many(countryName, names.join(', '), operators.length),
    })
    const fiveG = operators.filter((o) => o.network.includes('5G')).map((o) => o.name)
    out.push({
      q: f.q2(countryName),
      a: fiveG.length ? f.a2yes(countryName, fiveG.join(', ')) : f.a2no(countryName),
    })
  }

  const sizes = facts?.sizesMb ?? []
  if (sizes.length) {
    // The middle rung is what most people buy; the one above it is the answer
    // for anybody who says "but I watch video".
    const mid = sizes[Math.floor(sizes.length / 2)] ?? sizes[0]!
    const up = sizes.find((s) => s > mid) ?? mid
    out.push({ q: f.q3(countryName), a: f.a3(gb(mid), gb(up)) })
  }
  if (facts && facts.minDays > 0) {
    out.push({ q: f.q5, a: f.a5(facts.minDays, facts.maxDays) })
  }

  out.push({ q: f.q4(countryName), a: f.a4 })
  return out
}
