/**
 * The som figure a customer sees, one notch below the round number above it.
 *
 * A converted price lands on whatever the day's rate makes it — 220 439 so'm —
 * which reads as a number nobody chose. Shops here quote 199 000 and 99 900
 * instead, because a leading digit that drops is read as a lower price even when
 * the difference is a rounding error.
 *
 * This is a deliberate duplicate of `charm_uzs` in the API
 * (`app/services/currency.py`). The API charges what this shows, so the two must
 * agree to the som — a checkout that costs more than the page it came from is
 * the one difference nobody forgives. Change one, change the other; both sides
 * have tests over the same table of cases.
 */
export function charmUzs(amount: number): number {
  const a = Math.round(amount)
  // Below this the rounding is worth less than the noise it would add, and the
  // degenerate cases (a step larger than the amount) all live here.
  if (!Number.isFinite(a) || a < 5_000) return a

  let step: number
  if (a < 20_000) step = 100
  else if (a < 1_000_000) step = 1_000
  else step = 10_000

  const floored = Math.floor(a / step) * step
  // Landing exactly on a round multiple of ten steps is the case worth breaking:
  // 100 000 → 99 000, 30 000 → 29 000. 29 400 already reads low and stays put.
  return floored % (step * 10) === 0 && !readsLow(floored) ? floored - step : floored
}

/**
 * Does this figure already have a 9 in its second digit?
 *
 * 990 000 and 19 000 are what this function produces at one scale, and a
 * multiple of ten steps at the next scale down — so a second pass would cut them
 * again, to 989 000 and 18 900, and a price would walk downward every time it
 * was formatted. The second digit is what the eye reads, so a 9 there means the
 * work is already done.
 */
function readsLow(n: number): boolean {
  const digits = String(n)
  return digits.length >= 2 && digits[1] === '9'
}
