/**
 * How each brand is drawn on the picker.
 *
 * Twelve of the fifteen are real logo files in `public/brands/`, kept locally
 * rather than hotlinked: a picker that goes blank when somebody else's CDN
 * moves is worse than no picker. Google's is the four-colour G, because a
 * single-colour G is a different mark, not a monochrome rendering of this one.
 *
 * Three have no file yet — Infinix, TECNO and realme — and those fall back to
 * their wordmark set in the brand's own colour and weight. That is honest for
 * these three, whose logos *are* set type, but it is not the real letterform:
 * each of the three uses custom drawing the fallback only approximates.
 *
 * `width` and `height` are measured off the approved design, per brand, and
 * they deliberately disagree with each other. One shared size makes SAMSUNG
 * tiny beside Apple, because a wide wordmark and a tall symbol only look
 * equally present when they are drawn at different sizes — the eye compares
 * area and weight, not bounding boxes.
 *
 * `label` marks the two whose lockup includes the name in the design. The
 * other thirteen are wordmarks already, and printing the name under one is
 * printing it twice.
 */
export interface BrandMark {
  /** Exactly as `BRAND_ORDER` in data/esimDevices spells it — the join key. */
  brand: string
  /** What the tile prints when there is no logo file. */
  wordmark: string
  /** Fallback typography, used only when `logo` is absent or fails to load. */
  className: string
  /** e.g. `/brands/apple.svg`. Absent for the three with no file yet. */
  logo?: string
  /** Measured from the design, in px at the 1536-wide reference. */
  width?: number
  height?: number
  /** Print the brand name under the mark, as the design does for these two. */
  label?: boolean
}

const BASE = 'font-display leading-none'

export const BRAND_MARKS: BrandMark[] = [
  { brand: 'Apple', wordmark: 'Apple', logo: '/brands/apple.svg', width: 44, height: 52, label: true, className: `${BASE} text-[19px] font-700 tracking-[-0.03em] text-[#111111] dark:text-white` },
  { brand: 'Samsung', wordmark: 'SAMSUNG', logo: '/brands/samsung.svg', width: 153, height: 26, className: `${BASE} text-[17px] font-800 tracking-[0.02em] text-[#1428A0] dark:text-[#7b93ff]` },
  { brand: 'Xiaomi', wordmark: 'mi', logo: '/brands/xiaomi.svg', width: 60, height: 60, className: `${BASE} text-[22px] font-800 lowercase tracking-[-0.02em] text-[#FF6900]` },
  { brand: 'Google', wordmark: 'Google', logo: '/brands/google.svg', width: 52, height: 52, label: true, className: `${BASE} text-[19px] font-700 tracking-[-0.02em] text-[#4285F4]` },
  { brand: 'Honor', wordmark: 'HONOR', logo: '/brands/honor.svg', width: 125, height: 26, className: `${BASE} text-[17px] font-700 tracking-[0.06em] text-[#111111] dark:text-white` },
  { brand: 'Infinix', wordmark: 'Infinix', width: 113, height: 28, className: `${BASE} text-[26px] font-800 tracking-[-0.03em] text-[#111111] dark:text-white` },
  { brand: 'Tecno', wordmark: 'TECNO', width: 126, height: 28, className: `${BASE} text-[26px] font-800 tracking-[0.01em] text-[#0956CE] dark:text-[#6ba6f5]` },
  { brand: 'Realme', wordmark: 'realme', width: 123, height: 41, className: `${BASE} rounded-[6px] bg-[#FDC512] px-2.5 py-1.5 text-[23px] font-600 lowercase tracking-[-0.02em] text-[#111111]` },
  { brand: 'OPPO', wordmark: 'OPPO', logo: '/brands/oppo.svg', width: 125, height: 32, className: `${BASE} text-[18px] font-800 tracking-[0.02em] text-[#046A38] dark:text-[#4dbb85]` },
  { brand: 'Vivo', wordmark: 'vivo', logo: '/brands/vivo.svg', width: 125, height: 34, className: `${BASE} text-[20px] font-700 lowercase tracking-[-0.01em] text-[#415FFF] dark:text-[#8fa3ff]` },
  { brand: 'Huawei', wordmark: 'HUAWEI', logo: '/brands/huawei.svg', width: 74, height: 60, className: `${BASE} text-[16px] font-800 tracking-[0.05em] text-[#CF0A2C] dark:text-[#ff6b80]` },
  { brand: 'Motorola', wordmark: 'motorola', logo: '/brands/motorola.svg', width: 65, height: 65, className: `${BASE} text-[17px] font-700 lowercase tracking-[0.01em] text-[#003691] dark:text-[#6fa8e0]` },
  { brand: 'OnePlus', wordmark: 'OnePlus', logo: '/brands/oneplus.svg', width: 58, height: 58, className: `${BASE} text-[17px] font-700 tracking-[-0.01em] text-[#EB0029] dark:text-[#ff6e80]` },
  { brand: 'Sony', wordmark: 'SONY', logo: '/brands/sony.svg', width: 130, height: 25, className: `${BASE} text-[18px] font-700 tracking-[0.08em] text-[#111111] dark:text-white` },
  { brand: 'Nokia', wordmark: 'NOKIA', logo: '/brands/nokia.svg', width: 134, height: 24, className: `${BASE} text-[17px] font-700 tracking-[0.06em] text-[#124191] dark:text-[#7d9be0]` },
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
