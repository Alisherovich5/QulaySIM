export type EsimDevice = {
  brand: string
  model: string
  compatible: boolean
  note?: 'regional'
}

const yes = (brand: string, models: string[], regional = true): EsimDevice[] =>
  models.map((model) => ({ brand, model, compatible: true, ...(regional ? { note: 'regional' as const } : {}) }))

const no = (brand: string, models: string[]): EsimDevice[] =>
  models.map((model) => ({ brand, model, compatible: false }))

// Common models customers are most likely to search for. Keep this list explicit:
// eSIM support often differs by exact model and sales region.
export const ESIM_DEVICES: EsimDevice[] = [
  { brand: 'Apple', model: 'iPhone XR', compatible: true },
  { brand: 'Apple', model: 'iPhone XS', compatible: true },
  { brand: 'Apple', model: 'iPhone XS Max', compatible: true },
  ...yes('Apple', ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2022)', 'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16e', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 17e', 'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max']),
  ...yes('Google', ['Pixel 2', 'Pixel 3', 'Pixel 3 XL', 'Pixel 3a', 'Pixel 3a XL', 'Pixel 4', 'Pixel 4 XL', 'Pixel 4a', 'Pixel 4a 5G', 'Pixel 5', 'Pixel 5a', 'Pixel 6', 'Pixel 6a', 'Pixel 6 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel Fold', 'Pixel 8', 'Pixel 8a', 'Pixel 8 Pro', 'Pixel 9', 'Pixel 9a', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 9 Pro Fold', 'Pixel 10', 'Pixel 10 Pro', 'Pixel 10 Pro XL', 'Pixel 10 Pro Fold']),
  ...yes('Samsung', ['Galaxy S20', 'Galaxy S20+', 'Galaxy S20 Ultra', 'Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra', 'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra', 'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE', 'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE', 'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra', 'Galaxy S25 Edge', 'Galaxy S25 FE', 'Galaxy S26', 'Galaxy S26+', 'Galaxy S26 Ultra', 'Galaxy Note20', 'Galaxy Note20 Ultra', 'Galaxy Fold', 'Galaxy Z Flip', 'Galaxy Z Flip 5G', 'Galaxy Z Flip3', 'Galaxy Z Flip4', 'Galaxy Z Flip5', 'Galaxy Z Flip6', 'Galaxy Z Flip7', 'Galaxy Z Flip7 FE', 'Galaxy Z Fold2', 'Galaxy Z Fold3', 'Galaxy Z Fold4', 'Galaxy Z Fold5', 'Galaxy Z Fold6', 'Galaxy Z Fold7', 'Galaxy Z TriFold', 'Galaxy A54', 'Galaxy A55', 'Galaxy A56', 'Galaxy A35', 'Galaxy A36', 'Galaxy XCover7', 'Galaxy XCover7 Pro']),
  ...['P40', 'P40 Pro', 'Mate 40 Pro'].map((model) => ({ brand: 'Huawei', model, compatible: true, note: 'regional' as const })),
  ...['Find X3 Pro', 'Find X5', 'Find X5 Pro', 'Find X8', 'Find X8 Pro'].map((model) => ({ brand: 'OPPO', model, compatible: true, note: 'regional' as const })),
  ...['Xperia 1 IV', 'Xperia 1 V', 'Xperia 1 VI', 'Xperia 5 IV', 'Xperia 5 V', 'Xperia 10 IV', 'Xperia 10 V', 'Xperia 10 VI'].map((model) => ({ brand: 'Sony', model, compatible: true, note: 'regional' as const })),
  ...['Razr 2019', 'Razr 5G', 'Razr 40', 'Razr 40 Ultra', 'Razr 50', 'Razr 50 Ultra', 'Edge 40 Pro', 'Edge 50 Pro', 'Edge 50 Ultra'].map((model) => ({ brand: 'Motorola', model, compatible: true, note: 'regional' as const })),
  ...yes('Xiaomi', ['12T Pro', '13', '13 Lite', '13 Pro', '13T', '13T Pro', '14', '14 Pro', '14T', '14T Pro', '15', '15 Pro', '15 Ultra'], true),
  ...yes('OnePlus', ['11', '12', '13'], true),
  ...yes('Honor', ['Magic4 Pro', 'Magic5 Pro', 'Magic6 Pro', 'Magic7 Pro', 'Magic V2', 'Magic V3', '90'], true),
  ...yes('Nokia', ['G60 5G', 'X30 5G', 'XR21'], true),
  ...yes('Vivo', ['X90 Pro', 'X100 Pro', 'X200 Pro'], true),
  ...no('Apple', ['iPhone SE (2020)', 'iPhone X', 'iPhone 8', 'iPhone 8 Plus', 'iPhone 7', 'iPhone 7 Plus', 'iPhone 6s', 'iPhone 6']),
  ...no('Samsung', ['Galaxy S10', 'Galaxy S10+', 'Galaxy S9', 'Galaxy S8', 'Galaxy A10', 'Galaxy A20', 'Galaxy A30', 'Galaxy A50', 'Galaxy A51', 'Galaxy A52', 'Galaxy A53']),
  ...no('Google', ['Pixel (2016)']),
].sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))

export const deviceLabel = (device: EsimDevice) => `${device.brand} ${device.model}`

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
