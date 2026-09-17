/**
 * How each brand is drawn on the picker.
 *
 * Nine of the fifteen marks in the approved design *are* wordmarks — SAMSUNG,
 * HONOR, Infinix, TECNO, realme, OPPO, vivo, SONY, NOKIA are set type and
 * nothing else — so a wordmark in the brand's own colour and weight is not a
 * stand-in for those, it is the mark. The other six (Apple, Google, Xiaomi,
 * Huawei, Motorola, OnePlus) are symbols, and a symbol drawn from memory is a
 * fake logo: close enough to be mistaken for the real one and wrong in the
 * details that matter to the company that owns it. Those get the wordmark too
 * until real files exist.
 *
 * `logo` is how they arrive. Drop an SVG into `public/brands/` and name it
 * here; the tile swaps to it and falls back to the wordmark if the file 404s,
 * so a half-finished set never leaves an empty square on the page.
 *
 * Colours are the brands' own published values.
 */
export interface BrandMark {
  /** Exactly as `BRAND_ORDER` in data/esimDevices spells it — the join key. */
  brand: string
  /** What the tile prints when there is no logo file. */
  wordmark: string
  className: string
  /** e.g. `/brands/apple.svg`, once one exists. */
  logo?: string
}

const BASE = 'font-display leading-none'

export const BRAND_MARKS: BrandMark[] = [
  { brand: 'Apple', wordmark: 'Apple', className: `${BASE} text-[19px] font-700 tracking-[-0.03em] text-[#111111] dark:text-white` },
  { brand: 'Samsung', wordmark: 'SAMSUNG', className: `${BASE} text-[17px] font-800 tracking-[0.02em] text-[#1428A0] dark:text-[#7b93ff]` },
  { brand: 'Xiaomi', wordmark: 'mi', className: `${BASE} text-[22px] font-800 lowercase tracking-[-0.02em] text-[#FF6900]` },
  { brand: 'Google', wordmark: 'Google', className: `${BASE} text-[19px] font-700 tracking-[-0.02em] text-[#4285F4]` },
  { brand: 'Honor', wordmark: 'HONOR', className: `${BASE} text-[17px] font-700 tracking-[0.06em] text-[#111111] dark:text-white` },
  { brand: 'Infinix', wordmark: 'Infinix', className: `${BASE} text-[18px] font-700 tracking-[-0.02em] text-[#111111] dark:text-white` },
  { brand: 'Tecno', wordmark: 'TECNO', className: `${BASE} text-[17px] font-800 tracking-[0.04em] text-[#0057B8] dark:text-[#6ba6f5]` },
  { brand: 'Realme', wordmark: 'realme', className: `${BASE} rounded-[5px] bg-[#FFD200] px-2 py-1 text-[16px] font-700 lowercase tracking-[-0.01em] text-[#111111]` },
  { brand: 'OPPO', wordmark: 'OPPO', className: `${BASE} text-[18px] font-800 tracking-[0.02em] text-[#046A38] dark:text-[#4dbb85]` },
  { brand: 'Vivo', wordmark: 'vivo', className: `${BASE} text-[20px] font-700 lowercase tracking-[-0.01em] text-[#415FFF] dark:text-[#8fa3ff]` },
  { brand: 'Huawei', wordmark: 'HUAWEI', className: `${BASE} text-[16px] font-800 tracking-[0.05em] text-[#CF0A2C] dark:text-[#ff6b80]` },
  { brand: 'Motorola', wordmark: 'motorola', className: `${BASE} text-[17px] font-700 lowercase tracking-[0.01em] text-[#0B5AA2] dark:text-[#6fa8e0]` },
  { brand: 'OnePlus', wordmark: 'OnePlus', className: `${BASE} text-[17px] font-700 tracking-[-0.01em] text-[#EB0029] dark:text-[#ff6e80]` },
  { brand: 'Sony', wordmark: 'SONY', className: `${BASE} text-[18px] font-700 tracking-[0.08em] text-[#111111] dark:text-white` },
  { brand: 'Nokia', wordmark: 'NOKIA', className: `${BASE} text-[17px] font-700 tracking-[0.06em] text-[#124191] dark:text-[#7d9be0]` },
]

const BY_BRAND = new Map(BRAND_MARKS.map((mark) => [mark.brand, mark]))

/** The mark for a brand, or a plain one built from its name.
 *
 * A brand added to the device list without being added here still gets a tile
 * rather than a blank — the picker's job is to cover the list, not this file. */
export function brandMark(brand: string): BrandMark {
  return (
    BY_BRAND.get(brand) ?? {
      brand,
      wordmark: brand,
      className: `${BASE} text-[17px] font-700 tracking-[-0.01em] text-ink`,
    }
  )
}
