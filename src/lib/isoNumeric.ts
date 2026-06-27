// ISO 3166-1 alpha-2 -> numeric code, used to match our country codes against
// the world-atlas topojson (whose feature ids are ISO numeric codes).
// Covers the full catalog plus common countries for future expansion.
export const ISO2_TO_NUMERIC: Record<string, number> = {
  AF: 4, AL: 8, DZ: 12, AO: 24, AR: 32, AM: 51, AU: 36, AT: 40, AZ: 31,
  BH: 48, BD: 50, BY: 112, BE: 56, BO: 68, BA: 70, BR: 76, BG: 100,
  KH: 116, CM: 120, CA: 124, CL: 152, CN: 156, CO: 170, CR: 188, HR: 191,
  CU: 192, CY: 196, CZ: 203, DK: 208, DO: 214, EC: 218, EG: 818, SV: 222,
  EE: 233, ET: 231, FI: 246, FR: 250, GE: 268, DE: 276, GH: 288, GR: 300,
  GT: 320, HN: 340, HK: 344, HU: 348, IS: 352, IN: 356, ID: 360, IR: 364,
  IQ: 368, IE: 372, IL: 376, IT: 380, JM: 388, JP: 392, JO: 400, KZ: 398,
  KE: 404, KW: 414, KG: 417, LA: 418, LV: 428, LB: 422, LY: 434, LT: 440,
  LU: 442, MY: 458, MV: 462, MX: 484, MD: 498, MN: 496, ME: 499, MA: 504,
  MM: 104, NP: 524, NL: 528, NZ: 554, NG: 566, MK: 807, NO: 578, OM: 512,
  PK: 586, PA: 591, PY: 600, PE: 604, PH: 608, PL: 616, PT: 620, QA: 634,
  RO: 642, RU: 643, SA: 682, RS: 688, SG: 702, SK: 703, SI: 705, ZA: 710,
  KR: 410, ES: 724, LK: 144, SE: 752, CH: 756, TW: 158, TJ: 762, TZ: 834,
  TH: 764, TN: 788, TR: 792, TM: 795, UG: 800, UA: 804, AE: 784, GB: 826,
  US: 840, UY: 858, UZ: 860, VE: 862, VN: 704, YE: 887, ZM: 894, ZW: 716,
}

export function numericFor(iso2: string): number | undefined {
  return ISO2_TO_NUMERIC[iso2.toUpperCase()]
}
