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
  network_type: string
  supports_hotspot: boolean
  is_popular: boolean
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

export interface Quote {
  subtotal: number
  discount: number
  total: number
  promo_applied: boolean
  promo_message: string | null
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
