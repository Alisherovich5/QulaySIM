/** Approximate MB/hour, shared with the original trip recommender.
 * These are planning assumptions, not a promise of measured app usage. */
export const HOURLY_MB = { map: 6, chat: 3, social: 110, video: 350, call: 200 } as const
export const MB_PER_DAY = 400
export type Activity = keyof typeof HOURLY_MB

export function estimateData(days: number, hours: Record<Activity, number>) {
  const perDay = (Object.keys(HOURLY_MB) as Activity[]).reduce(
    (sum, key) => sum + HOURLY_MB[key] * Math.max(0, hours[key]),
    0,
  )
  const gb = (perDay * Math.max(1, days)) / 1024
  return { gb, suggestedGb: Math.max(1, Math.ceil(gb * 1.2)) }
}
