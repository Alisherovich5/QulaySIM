/**
 * Which phones have an eSIM, as a list a customer can search.
 *
 * The list is explicit on purpose. eSIM support is not a property of a brand or
 * even of a model year — it is a property of the exact model, and often of the
 * market that model was sold in. The same iPhone 14 has an eSIM everywhere
 * except mainland China; Samsung ships A-series variants both ways.
 *
 * Written for the phones people here actually carry. The compatible half is
 * mostly flagships, which is the easy half; the half that matters is the one
 * below it — Redmi, Poco, Infinix, Tecno, the cheap Galaxy A rungs. Those are
 * the most common phones in Uzbekistan and none of them has an eSIM, so a
 * customer who owns one needs to find that out here rather than after paying.
 *
 * `note: 'regional'` means: this model exists in both forms, so the answer is
 * "probably yes, and *#06# settles it in fifteen seconds". Nothing on the page
 * turns that into a plain yes.
 *
 * `codes` are the model numbers a phone shows in Settings and in the *#06#
 * sheet. They are searchable because that string — SM-S918B, not "S23 Ultra" —
 * is what somebody reading their own screen has in front of them.
 */

export type EsimDevice = {
  brand: string
  model: string
  compatible: boolean
  note?: 'regional'
  /** Model numbers as printed by the device itself. */
  codes?: string[]
}

const yes = (brand: string, models: string[], regional = true): EsimDevice[] =>
  models.map((model) => ({ brand, model, compatible: true, ...(regional ? { note: 'regional' as const } : {}) }))

const no = (brand: string, models: string[]): EsimDevice[] =>
  models.map((model) => ({ brand, model, compatible: false }))

/** Model numbers, kept beside the list rather than inside it: one Galaxy has
 *  four regional numbers and threading them through `yes()` would bury the
 *  models themselves. */
const CODES: Record<string, string[]> = {
  'Galaxy S23': ['SM-S911'],
  'Galaxy S23+': ['SM-S916'],
  'Galaxy S23 Ultra': ['SM-S918'],
  'Galaxy S24': ['SM-S921'],
  'Galaxy S24+': ['SM-S926'],
  'Galaxy S24 Ultra': ['SM-S928'],
  'Galaxy S25': ['SM-S931'],
  'Galaxy S25+': ['SM-S936'],
  'Galaxy S25 Ultra': ['SM-S938'],
  'Galaxy A35': ['SM-A356'],
  'Galaxy A36': ['SM-A366'],
  'Galaxy A54': ['SM-A546'],
  'Galaxy A55': ['SM-A556'],
  'Galaxy A56': ['SM-A566'],
  'Galaxy Z Flip5': ['SM-F731'],
  'Galaxy Z Flip6': ['SM-F741'],
  'Galaxy Z Fold5': ['SM-F946'],
  'Galaxy Z Fold6': ['SM-F956'],
  'Galaxy A05': ['SM-A055'],
  'Galaxy A06': ['SM-A065'],
  'Galaxy A12': ['SM-A125'],
  'Galaxy A13': ['SM-A135'],
  'Galaxy A14': ['SM-A145'],
  'Galaxy A15': ['SM-A155', 'SM-A156'],
  'Galaxy A16': ['SM-A165', 'SM-A166'],
  'Galaxy A24': ['SM-A245'],
  'Galaxy A25': ['SM-A256'],
  'Galaxy A26': ['SM-A266'],
  'Galaxy A34': ['SM-A346'],
  'Galaxy A52': ['SM-A525', 'SM-A526'],
  'Galaxy A53': ['SM-A536'],
  'Galaxy S10': ['SM-G973'],
  'Galaxy S21': ['SM-G991'],
  'Galaxy S22': ['SM-S901'],
  'Galaxy S22 Ultra': ['SM-S908'],
  'Redmi Note 12': ['23021RAA2Y'],
  'Redmi Note 13': ['23129RAA4G'],
  'Redmi Note 14': ['24117RN76G'],
}

const withCodes = (devices: EsimDevice[]): EsimDevice[] =>
  devices.map((device) => (CODES[device.model] ? { ...device, codes: CODES[device.model] } : device))

export const ESIM_DEVICES: EsimDevice[] = withCodes([
  { brand: 'Apple', model: 'iPhone XR', compatible: true },
  { brand: 'Apple', model: 'iPhone XS', compatible: true },
  { brand: 'Apple', model: 'iPhone XS Max', compatible: true },
  ...yes('Apple', ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2022)', 'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16e', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 17e', 'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max']),
  ...yes('Google', ['Pixel 2', 'Pixel 3', 'Pixel 3 XL', 'Pixel 3a', 'Pixel 3a XL', 'Pixel 4', 'Pixel 4 XL', 'Pixel 4a', 'Pixel 4a 5G', 'Pixel 5', 'Pixel 5a', 'Pixel 6', 'Pixel 6a', 'Pixel 6 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel Fold', 'Pixel 8', 'Pixel 8a', 'Pixel 8 Pro', 'Pixel 9', 'Pixel 9a', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 9 Pro Fold', 'Pixel 10', 'Pixel 10 Pro', 'Pixel 10 Pro XL', 'Pixel 10 Pro Fold']),
  ...yes('Samsung', ['Galaxy S20', 'Galaxy S20+', 'Galaxy S20 Ultra', 'Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra', 'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra', 'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE', 'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE', 'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra', 'Galaxy S25 Edge', 'Galaxy S25 FE', 'Galaxy S26', 'Galaxy S26+', 'Galaxy S26 Ultra', 'Galaxy Note20', 'Galaxy Note20 Ultra', 'Galaxy Fold', 'Galaxy Z Flip', 'Galaxy Z Flip 5G', 'Galaxy Z Flip3', 'Galaxy Z Flip4', 'Galaxy Z Flip5', 'Galaxy Z Flip6', 'Galaxy Z Flip7', 'Galaxy Z Flip7 FE', 'Galaxy Z Fold2', 'Galaxy Z Fold3', 'Galaxy Z Fold4', 'Galaxy Z Fold5', 'Galaxy Z Fold6', 'Galaxy Z Fold7', 'Galaxy Z TriFold', 'Galaxy A54', 'Galaxy A55', 'Galaxy A56', 'Galaxy A35', 'Galaxy A36', 'Galaxy XCover7', 'Galaxy XCover7 Pro']),
  ...yes('Huawei', ['P40', 'P40 Pro', 'Mate 40 Pro']),
  ...yes('OPPO', ['Find X3 Pro', 'Find X5', 'Find X5 Pro', 'Find X8', 'Find X8 Pro']),
  ...yes('Sony', ['Xperia 1 IV', 'Xperia 1 V', 'Xperia 1 VI', 'Xperia 5 IV', 'Xperia 5 V', 'Xperia 10 IV', 'Xperia 10 V', 'Xperia 10 VI']),
  ...yes('Motorola', ['Razr 2019', 'Razr 5G', 'Razr 40', 'Razr 40 Ultra', 'Razr 50', 'Razr 50 Ultra', 'Edge 40 Pro', 'Edge 50 Pro', 'Edge 50 Ultra']),
  ...yes('Xiaomi', ['12T Pro', '13', '13 Lite', '13 Pro', '13T', '13T Pro', '14', '14 Pro', '14T', '14T Pro', '15', '15 Pro', '15 Ultra']),
  ...yes('OnePlus', ['11', '12', '13']),
  ...yes('Honor', ['Magic4 Pro', 'Magic5 Pro', 'Magic6 Pro', 'Magic7 Pro', 'Magic V2', 'Magic V3', '90']),
  ...yes('Nokia', ['G60 5G', 'X30 5G', 'XR21']),
  ...yes('Vivo', ['X90 Pro', 'X100 Pro', 'X200 Pro']),

  // ── The half that gets somebody their money back ──────────────────────────
  // Everything below has no eSIM hardware. These are the phones sold most in
  // Uzbekistan, so this is the half of the list that gets read.
  ...no('Apple', ['iPhone SE (2020)', 'iPhone X', 'iPhone 8', 'iPhone 8 Plus', 'iPhone 7', 'iPhone 7 Plus', 'iPhone 6s', 'iPhone 6']),
  ...no('Samsung', ['Galaxy S10', 'Galaxy S10+', 'Galaxy S10e', 'Galaxy S9', 'Galaxy S9+', 'Galaxy S8', 'Galaxy A03', 'Galaxy A04', 'Galaxy A05', 'Galaxy A05s', 'Galaxy A06', 'Galaxy A10', 'Galaxy A12', 'Galaxy A13', 'Galaxy A14', 'Galaxy A15', 'Galaxy A16', 'Galaxy A20', 'Galaxy A21s', 'Galaxy A22', 'Galaxy A23', 'Galaxy A24', 'Galaxy A25', 'Galaxy A26', 'Galaxy A30', 'Galaxy A31', 'Galaxy A32', 'Galaxy A33', 'Galaxy A34', 'Galaxy A50', 'Galaxy A51', 'Galaxy A52', 'Galaxy A53', 'Galaxy M14', 'Galaxy M15', 'Galaxy M34', 'Galaxy Tab A9']),
  ...no('Google', ['Pixel (2016)']),
  ...no('Xiaomi', ['Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 10', 'Redmi 10C', 'Redmi 12', 'Redmi 12C', 'Redmi 13', 'Redmi 13C', 'Redmi 14C', 'Redmi A3', 'Redmi A5', 'Redmi Note 8', 'Redmi Note 8 Pro', 'Redmi Note 9', 'Redmi Note 9S', 'Redmi Note 9 Pro', 'Redmi Note 10', 'Redmi Note 10 Pro', 'Redmi Note 11', 'Redmi Note 11 Pro', 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 13', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 14', 'Redmi Note 14 Pro', 'Redmi Note 14 Pro+', 'Poco C65', 'Poco M5', 'Poco M6', 'Poco M6 Pro', 'Poco F5', 'Poco F6', 'Poco X5', 'Poco X6', 'Poco X6 Pro', 'Poco X7', 'Poco X7 Pro', 'Xiaomi 11 Lite', 'Xiaomi 12 Lite', 'Redmi Pad']),
  ...no('Infinix', ['Hot 30', 'Hot 40', 'Hot 40i', 'Hot 50', 'Note 30', 'Note 40', 'Note 40 Pro', 'Note 50', 'Smart 8', 'Smart 9', 'Zero 30', 'Zero 40']),
  ...no('Tecno', ['Camon 20', 'Camon 30', 'Spark 10', 'Spark 20', 'Spark 30', 'Pova 5', 'Pova 6', 'Pop 8']),
  ...no('Realme', ['C33', 'C51', 'C53', 'C55', 'C61', 'C67', 'Note 50', 'Note 60', '10', '11', '12', '12 Pro', '13', '14']),
  ...no('Honor', ['X6', 'X7', 'X8', 'X8b', 'X9a', 'X9b', 'X6b', '200 Lite']),
  ...no('Vivo', ['Y17s', 'Y18', 'Y27', 'Y28', 'Y36', 'Y100', 'V29', 'V30']),
  ...no('OPPO', ['A17', 'A18', 'A38', 'A58', 'A78', 'A79', 'A80', 'Reno 8', 'Reno 10', 'Reno 11', 'Reno 12']),
  ...no('Huawei', ['Nova 9', 'Nova 10', 'Nova 11', 'Nova 12', 'Nova Y61', 'Nova Y70', 'Nova Y90']),
].sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)))

export const deviceLabel = (device: EsimDevice) => `${device.brand} ${device.model}`

/**
 * One spelling for every way a phone gets typed.
 *
 * People write "Apple iPhone 13", "iphone13", "13 pro max", "Samsung Galaxy
 * A55", "SM-A556B". Brand and family words are collapsed to a single token so
 * all of those land on the same string, and everything else is reduced to
 * letters and digits — which also takes care of the hyphen in a model number.
 */
export const normalizeDeviceSearch = (value: string) => value
  .toLocaleLowerCase()
  .replace(/apple\s+iphone/g, 'iphone')
  .replace(/\bapple\b/g, 'iphone')
  .replace(/samsung\s+galaxy/g, 'samsung')
  .replace(/\bgalaxy\b/g, 'samsung')
  .replace(/google\s+pixel/g, 'pixel')
  .replace(/\bgoogle\b/g, 'pixel')
  .replace(/(iphone|samsung|pixel)\s*\1/g, '$1')
  .replace(/\bplus\b/g, '+')
  .replace(/[^a-z0-9+]+/g, '')

/** Every searchable spelling of one device: brand + model, the model alone, and
 *  each model number the device prints on its own screen. */
export const searchTokens = (device: EsimDevice): string[] => [
  normalizeDeviceSearch(deviceLabel(device)),
  normalizeDeviceSearch(device.model),
  ...(device.codes ?? []).map(normalizeDeviceSearch),
]

/** Brands, most-stocked first rather than alphabetical: the four that cover
 *  most of the market are the four worth putting under a thumb. */
const BRAND_ORDER = ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Honor', 'Infinix', 'Tecno', 'Realme', 'OPPO', 'Vivo', 'Huawei', 'Motorola', 'OnePlus', 'Sony', 'Nokia']

export const DEVICE_BRANDS: { brand: string; total: number; supported: number }[] = BRAND_ORDER
  .map((brand) => {
    const models = ESIM_DEVICES.filter((d) => d.brand === brand)
    return { brand, total: models.length, supported: models.filter((d) => d.compatible).length }
  })
  .filter((entry) => entry.total > 0)

/**
 * The models a query could mean, best first.
 *
 * Ranking, not filtering: "iphone 1" has to put iPhone 11 above iPhone 15 Pro
 * Max, and a search for "13" must not bury Redmi Note 13 under everything that
 * merely contains the digits. A prefix hit outranks a contained hit, and a
 * shorter name outranks a longer one at the same rank — which is the same rule
 * as "the model whose whole name you typed is the one you meant".
 */
export function findDevices(query: string, limit = 8): EsimDevice[] {
  const needle = normalizeDeviceSearch(query)
  if (needle.length < 1) return []

  const scored: { device: EsimDevice; score: number }[] = []
  for (const device of ESIM_DEVICES) {
    let best = 0
    for (const token of searchTokens(device)) {
      if (token === needle) best = Math.max(best, 4)
      else if (token.startsWith(needle)) best = Math.max(best, 3)
      else if (token.includes(needle)) best = Math.max(best, 2)
    }
    if (best > 0) scored.push({ device, score: best })
  }

  return scored
    .sort((a, b) => b.score - a.score || deviceLabel(a.device).length - deviceLabel(b.device).length)
    .slice(0, limit)
    .map((entry) => entry.device)
}
