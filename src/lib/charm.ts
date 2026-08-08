/**
 * The som figure a customer sees, always ending in 999.
 *
 * A converted price lands on whatever the day's rate makes it — 220 437 so'm —
 * a number nobody chose. Shops here quote 219 999, because a price ending in
 * 999 is read as belonging to the band below it.
 *
 * The rule is one line: round to the nearest thousand, then subtract one. That
 * single step also produces every threshold drop by itself, because X 000 minus
 * 1 is (X-1) 999 — so 100 000 becomes 99 999, 30 000 becomes 29 999, and
 * 1 000 000 becomes 999 999 without any of them being special-cased.
 *
 * This is a deliberate duplicate of `charm_uzs` in the API
 * (`app/services/currency.py`). The API charges what this shows, so the two must
 * agree to the som — a checkout that costs more than the page it came from is
 * the one difference nobody forgives. Change one, change the other; both sides
 * are checked against the same table of cases.
 */
export function charmUzs(amount: number): number {
  const a = Math.round(amount)
  // Below this a thousand-som step is bigger than the price itself and the rule
  // would produce nonsense. The cheapest plan is about 12 000 so'm.
  if (!Number.isFinite(a) || a < 2_000) return a
  // Half-up to the nearest thousand, then one below it.
  return Math.floor((a + 500) / 1_000) * 1_000 - 1
}
