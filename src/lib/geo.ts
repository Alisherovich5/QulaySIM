/**
 * Where each destination actually is.
 *
 * The catalogue the API returns knows a country's name, its ISO 3166-1 alpha-2
 * code and which region it was filed under. It does not know where the country
 * is, and the site needs that in three places that all used to invent it or go
 * without:
 *
 *   - `geo.*` meta tags, which say what geography a page is *about*. A
 *     catalogue of travel data plans is a geographic product; every destination
 *     page was shipping without a single geographic signal on it.
 *   - schema.org `Country` with real coordinates, so a destination page
 *     declares the place it sells data for rather than only the price.
 *   - `areaServed` on the organisation, which was the bare string `'UZ'` —
 *     true of where the customers are, and silent about the twenty-five
 *     countries the service covers.
 *
 * Coordinates are the country centroid, not the capital: the page is about the
 * country, and a `Place` pinned to the capital claims something narrower than
 * the truth. Where the two coincide — Singapore — they coincide.
 *
 * ISO 3166-1 codes, ISO 4217 currencies and IANA time zone identifiers, so
 * every field here is checkable against a standard rather than against
 * somebody's memory.
 */

export interface GeoFacts {
  /** ISO 3166-1 alpha-2, the same code the catalogue uses. */
  iso2: string
  /** ISO 3166-1 alpha-3, which schema.org and most map data prefer. */
  iso3: string
  /** English name, for the machine-readable layer only — the visible name is
      whatever the API returned in the visitor's language. */
  name: string
  /** Country centroid. */
  lat: number
  lon: number
  capital: string
  /** schema.org Continent name. */
  continent: string
  /** ISO 4217. */
  currency: string
  /** E.164 country calling code, with the plus. */
  callingCode: string
  /** IANA identifier for the zone most of the population lives in. */
  timeZone: string
}

const FACTS: readonly GeoFacts[] = [
  { iso2: 'UZ', iso3: 'UZB', name: 'Uzbekistan', lat: 41.3775, lon: 64.5853, capital: 'Tashkent', continent: 'Asia', currency: 'UZS', callingCode: '+998', timeZone: 'Asia/Tashkent' },
  { iso2: 'TR', iso3: 'TUR', name: 'Türkiye', lat: 38.9637, lon: 35.2433, capital: 'Ankara', continent: 'Asia', currency: 'TRY', callingCode: '+90', timeZone: 'Europe/Istanbul' },
  { iso2: 'GE', iso3: 'GEO', name: 'Georgia', lat: 42.3154, lon: 43.3569, capital: 'Tbilisi', continent: 'Asia', currency: 'GEL', callingCode: '+995', timeZone: 'Asia/Tbilisi' },
  { iso2: 'US', iso3: 'USA', name: 'United States', lat: 37.0902, lon: -95.7129, capital: 'Washington, D.C.', continent: 'North America', currency: 'USD', callingCode: '+1', timeZone: 'America/New_York' },
  { iso2: 'VN', iso3: 'VNM', name: 'Vietnam', lat: 14.0583, lon: 108.2772, capital: 'Hanoi', continent: 'Asia', currency: 'VND', callingCode: '+84', timeZone: 'Asia/Ho_Chi_Minh' },
  { iso2: 'TH', iso3: 'THA', name: 'Thailand', lat: 15.87, lon: 100.9925, capital: 'Bangkok', continent: 'Asia', currency: 'THB', callingCode: '+66', timeZone: 'Asia/Bangkok' },
  { iso2: 'MY', iso3: 'MYS', name: 'Malaysia', lat: 4.2105, lon: 101.9758, capital: 'Kuala Lumpur', continent: 'Asia', currency: 'MYR', callingCode: '+60', timeZone: 'Asia/Kuala_Lumpur' },
  { iso2: 'JP', iso3: 'JPN', name: 'Japan', lat: 36.2048, lon: 138.2529, capital: 'Tokyo', continent: 'Asia', currency: 'JPY', callingCode: '+81', timeZone: 'Asia/Tokyo' },
  { iso2: 'FR', iso3: 'FRA', name: 'France', lat: 46.2276, lon: 2.2137, capital: 'Paris', continent: 'Europe', currency: 'EUR', callingCode: '+33', timeZone: 'Europe/Paris' },
  { iso2: 'CN', iso3: 'CHN', name: 'China', lat: 35.8617, lon: 104.1954, capital: 'Beijing', continent: 'Asia', currency: 'CNY', callingCode: '+86', timeZone: 'Asia/Shanghai' },
  { iso2: 'ES', iso3: 'ESP', name: 'Spain', lat: 40.4637, lon: -3.7492, capital: 'Madrid', continent: 'Europe', currency: 'EUR', callingCode: '+34', timeZone: 'Europe/Madrid' },
  { iso2: 'AZ', iso3: 'AZE', name: 'Azerbaijan', lat: 40.1431, lon: 47.5769, capital: 'Baku', continent: 'Asia', currency: 'AZN', callingCode: '+994', timeZone: 'Asia/Baku' },
  { iso2: 'AE', iso3: 'ARE', name: 'United Arab Emirates', lat: 23.4241, lon: 53.8478, capital: 'Abu Dhabi', continent: 'Asia', currency: 'AED', callingCode: '+971', timeZone: 'Asia/Dubai' },
  { iso2: 'DE', iso3: 'DEU', name: 'Germany', lat: 51.1657, lon: 10.4515, capital: 'Berlin', continent: 'Europe', currency: 'EUR', callingCode: '+49', timeZone: 'Europe/Berlin' },
  { iso2: 'GB', iso3: 'GBR', name: 'United Kingdom', lat: 55.3781, lon: -3.436, capital: 'London', continent: 'Europe', currency: 'GBP', callingCode: '+44', timeZone: 'Europe/London' },
  { iso2: 'QA', iso3: 'QAT', name: 'Qatar', lat: 25.3548, lon: 51.1839, capital: 'Doha', continent: 'Asia', currency: 'QAR', callingCode: '+974', timeZone: 'Asia/Qatar' },
  { iso2: 'IT', iso3: 'ITA', name: 'Italy', lat: 41.8719, lon: 12.5674, capital: 'Rome', continent: 'Europe', currency: 'EUR', callingCode: '+39', timeZone: 'Europe/Rome' },
  { iso2: 'KZ', iso3: 'KAZ', name: 'Kazakhstan', lat: 48.0196, lon: 66.9237, capital: 'Astana', continent: 'Asia', currency: 'KZT', callingCode: '+7', timeZone: 'Asia/Almaty' },
  { iso2: 'SA', iso3: 'SAU', name: 'Saudi Arabia', lat: 23.8859, lon: 45.0792, capital: 'Riyadh', continent: 'Asia', currency: 'SAR', callingCode: '+966', timeZone: 'Asia/Riyadh' },
  { iso2: 'EG', iso3: 'EGY', name: 'Egypt', lat: 26.8206, lon: 30.8025, capital: 'Cairo', continent: 'Africa', currency: 'EGP', callingCode: '+20', timeZone: 'Africa/Cairo' },
  { iso2: 'SG', iso3: 'SGP', name: 'Singapore', lat: 1.3521, lon: 103.8198, capital: 'Singapore', continent: 'Asia', currency: 'SGD', callingCode: '+65', timeZone: 'Asia/Singapore' },
  { iso2: 'KR', iso3: 'KOR', name: 'South Korea', lat: 35.9078, lon: 127.7669, capital: 'Seoul', continent: 'Asia', currency: 'KRW', callingCode: '+82', timeZone: 'Asia/Seoul' },
  { iso2: 'AU', iso3: 'AUS', name: 'Australia', lat: -25.2744, lon: 133.7751, capital: 'Canberra', continent: 'Oceania', currency: 'AUD', callingCode: '+61', timeZone: 'Australia/Sydney' },
  { iso2: 'BR', iso3: 'BRA', name: 'Brazil', lat: -14.235, lon: -51.9253, capital: 'Brasília', continent: 'South America', currency: 'BRL', callingCode: '+55', timeZone: 'America/Sao_Paulo' },
  { iso2: 'MX', iso3: 'MEX', name: 'Mexico', lat: 23.6345, lon: -102.5528, capital: 'Mexico City', continent: 'North America', currency: 'MXN', callingCode: '+52', timeZone: 'America/Mexico_City' },
  { iso2: 'ID', iso3: 'IDN', name: 'Indonesia', lat: -0.7893, lon: 113.9213, capital: 'Jakarta', continent: 'Asia', currency: 'IDR', callingCode: '+62', timeZone: 'Asia/Jakarta' },
  { iso2: 'IN', iso3: 'IND', name: 'India', lat: 20.5937, lon: 78.9629, capital: 'New Delhi', continent: 'Asia', currency: 'INR', callingCode: '+91', timeZone: 'Asia/Kolkata' },
  { iso2: 'KG', iso3: 'KGZ', name: 'Kyrgyzstan', lat: 41.2044, lon: 74.7661, capital: 'Bishkek', continent: 'Asia', currency: 'KGS', callingCode: '+996', timeZone: 'Asia/Bishkek' },
  { iso2: 'TJ', iso3: 'TJK', name: 'Tajikistan', lat: 38.861, lon: 71.2761, capital: 'Dushanbe', continent: 'Asia', currency: 'TJS', callingCode: '+992', timeZone: 'Asia/Dushanbe' },
  { iso2: 'RU', iso3: 'RUS', name: 'Russia', lat: 61.524, lon: 105.3188, capital: 'Moscow', continent: 'Europe', currency: 'RUB', callingCode: '+7', timeZone: 'Europe/Moscow' },
]

const BY_ISO2 = new Map(FACTS.map((f) => [f.iso2, f]))

/** The market the site is written for, and what the home page is about. */
export const HOME_GEO = BY_ISO2.get('UZ')!

/** Geography for a catalogue country, or undefined for one not in the table.
 *
 * Undefined is a normal answer, not an error. The catalogue is edited in the
 * admin and a country can be added there at any time; a page that then omits
 * its geo tags is correct, and one that emits invented coordinates is not.
 */
export function geoFor(iso2: string | null | undefined): GeoFacts | undefined {
  return iso2 ? BY_ISO2.get(iso2.toUpperCase()) : undefined
}

/** Every destination the table covers, for the organisation's service area. */
export function allGeo(): readonly GeoFacts[] {
  return FACTS
}
