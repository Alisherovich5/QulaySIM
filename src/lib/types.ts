export interface Region {
  id: number
  name: string
  slug: string
  /** Countries one regional eSIM covers, and the cheapest such plan. Zero and
   *  null mean the region has no multi-country plan of its own yet. */
  country_count: number
  starting_price: number | null
}

/**
 * A region with the multi-country eSIMs sold for it.
 *
 * The product for a traveller doing three countries on one trip: one eSIM
 * instead of three. `country_count` is why anyone buys it — "Yevropa 5 GB" says
 * nothing about whether their stop is covered, "41 ta davlat" says everything.
 */
export interface RegionDetail extends Region {
  plans: Plan[]
  starting_price: number | null
  country_count: number
}

export interface Plan {
  id: number
  scope: string
  title: string
  data_amount_mb: number
  is_unlimited: boolean
  data_label: string
  validity_days: number
  price_usd: number
  /** Free text beside the price, e.g. "+ deposit". Empty for most plans. */
  price_note: string
  network_type: string
  supports_hotspot: boolean
  is_popular: boolean
  /** ISO2 codes a multi-country plan covers. Empty for a single country,
   *  where the page it sits on already names the destination. */
  coverage?: string[]
}

export interface Country {
  id: number
  name: string
  slug: string
  iso2: string
  is_popular: boolean
  region: Region | null
  starting_price: number | null
}

export interface CountryDetail extends Country {
  plans: Plan[]
}

export interface ESIM {
  id: number
  iccid: string
  qr_payload: string
  qr_image: string
  status: 'pending' | 'active' | 'expired'
  data_total_mb: number
  data_used_mb: number
  validity_days: number
  activated_at: string | null
  expires_at: string | null
  created_at: string
  /** What was paid at the sale, not the plan's price today. Null if unknown.
   *  Strings: these are Decimal columns, and the API serialises them as such
   *  rather than risk a float rounding a price. Convert before arithmetic. */
  paid_usd: string | null
  paid_uzs: string | null
  plan: Plan
}

export interface Order {
  id: number
  status: string
  subtotal: number
  discount: number
  total: number
  created_at: string
  paid_at: string | null
  esims: ESIM[]
}

export interface QuoteLine {
  plan_id: number
  title: string
  unit_price: number
  quantity: number
  line_total: number
}

export interface Quote {
  subtotal: number
  discount: number
  total: number
  promo_applied: boolean
  promo_message: string | null
  /** Stable slug for a refusal, so it can be translated. Prose stays in
   *  `promo_message` as the fallback for a slug we do not know yet. */
  promo_reason: string | null
  /** The code's minimum, sent only when that is why it was refused. */
  promo_min_order_usd: number | null
  /** Server-side prices. The cart in localStorage can be hours out of date. */
  lines: QuoteLine[]
}

export interface Customer {
  id: number
  email: string
  full_name: string
  created_at: string
  /** Has ever paid for an order. Hides the first-order promo strip. */
  has_purchases: boolean
}

export interface Faq {
  id: number
  question: string
  answer: string
  category: string
}

// Admin-managed landing content (localized server-side).
export interface Benefit {
  id: number
  icon: string
  title: string
  text: string
}

export interface Testimonial {
  id: number
  name: string
  location: string
  text: string
  rating: number
}

export interface Device {
  id: number
  name: string
}

export interface Promo {
  eyebrow: string
  title: string
  text: string
  code: string
  cta_link: string
  /** Short line for the bar above the nav; empty means use the built-in wording. */
  strip_text: string
  /** From the promo code that actually applies the discount, so the advertised
   *  figure and the one checkout takes off cannot differ. Null if no code linked. */
  discount_type: 'percent' | 'fixed' | null
  first_order_only?: boolean
  discount_value: number | null
}

export interface LandingContent {
  benefits: Benefit[]
  testimonials: Testimonial[]
  devices: Device[]
  faqs: Faq[]
  promo: Promo | null
}

export interface ReferralEntry {
  referred_email: string
  /** Odam ro'yxatdan o'tganda kiritgan ismi. Bo'sh bo'lishi mumkin: taklif
   *  yuborilgan, lekin hali hech kim qabul qilmagan bo'lsa. */
  referred_name: string
  status: string
  reward_code: string
  created_at: string
  completed_at: string | null
  /** Aynan shu odam uchun tegadigan summa, so'mda. Umumiy summani odamlar
   *  soniga bo'lish to'g'ri javob bermaydi: stavka pog'onali va har bir mijoz
   *  o'zi kelgan paytdagi stavkani saqlab qoladi. */
  commission_uzs: number
}

/** Hozirgi stavka. `label` -- ekranga chiqadigan yagona haqiqat: u foiz ham
 *  ("5%"), qat'iy summa ham ("5000 so'm") bo'lishi mumkin va front bu ikkisini
 *  ajratib o'tirmaydi. */
export interface ReferralRate {
  label: string
  percent: number | null
  flat_uzs: number | null
}

export interface ReferralNextRate {
  label: string
  percent: number | null
  flat_uzs: number | null
  /** Nechta mijozdan keyin yangi stavka boshlanadi. */
  at: number
  /** Yana nechta mijoz kerak. */
  needed: number
}

export interface ReferralSummary {
  code: string
  invited: number
  completed: number
  pending: number
  /** Sotib olgan har bir mijoz uchun tegadigan summalar yig'indisi. Serverda
   *  hisoblanadi, chunki foydalanuvchi ochadigan savol shu -- ko'paytirishni
   *  odamning zimmasiga qoldirish nizoga olib keladi. */
  earned_uzs: number
  rate: ReferralRate
  next_rate: ReferralNextRate | null
  rewards: string[]
  entries: ReferralEntry[]
}

export interface CartItem {
  plan: Plan
  countryName: string
  iso2: string
  quantity: number
}

export interface PassportCountry {
  iso2: string
  name: string
  esims: number
}

export interface AccountSummary {
  full_name: string
  email: string
  member_since: string
  active_esims: number
  total_esims: number
  data_used_mb: number
  data_total_mb: number
  countries_connected: number
  total_spent: number
  orders_count: number
  /** Inline data URI, or null when the customer has not set a photo. */
  avatar_url: string | null
  /** Referal bo'limi shu mijozga ochiqmi. Eski serverda bu maydon yo'q, shuning
   *  uchun yo'qligi "ochiq" deb o'qiladi -- bo'lim jimgina g'oyib bo'lmasin. */
  referral_enabled?: boolean
  passport: PassportCountry[]
}
