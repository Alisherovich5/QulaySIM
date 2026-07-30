export interface Region {
  id: number
  name: string
  slug: string
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
}

/** A popular plan carries its destination so a landing-page card can stand alone. */
export interface PopularPlan extends Plan {
  country_name: string
  country_slug: string
  country_iso2: string
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
  /** Server-side prices. The cart in localStorage can be hours out of date. */
  lines: QuoteLine[]
}

export interface Customer {
  id: number
  email: string
  full_name: string
  created_at: string
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
  status: string
  reward_code: string
  created_at: string
}

export interface ReferralSummary {
  code: string
  invited: number
  completed: number
  pending: number
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
  passport: PassportCountry[]
}
