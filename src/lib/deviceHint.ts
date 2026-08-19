/**
 * What the browser will admit about the phone it is running on.
 *
 * Almost nothing, and the little there is comes in two very different shapes.
 *
 * Android (Chromium) will hand over the model on request — "SM-A556E",
 * "Pixel 8", "23129RAA4G" — through the client-hints API. That is a fact about
 * the device, so it is worth asking for, and it is exactly the string the
 * customer would otherwise be copying out of their own settings.
 *
 * iOS says only "iPhone", ever. But it does say which iOS, and that is enough
 * to reason with: iOS 17 dropped the iPhone 8 and the iPhone X, so every phone
 * that can run 17 or later is an iPhone XR or newer — and every iPhone from the
 * XR on has an eSIM. The one hole is the mainland-China variants, which have no
 * eSIM and run the same iOS, so the page always offers the *#06# confirmation
 * rather than treating this as settled.
 *
 * Nothing here is sent anywhere. The check happens in the visitor's browser and
 * the answer is drawn on their screen; see the privacy note on the page.
 */

export type DeviceHint =
  /** A model string from the device itself, to be looked up in the list. */
  | { kind: 'model'; model: string }
  /** An iPhone new enough that eSIM follows from the iOS version. */
  | { kind: 'ios'; version: number }

type HighEntropyUA = {
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platform?: string }>
  platform?: string
}

/** iOS 17 is the first release that requires an iPhone XR or newer — the same
 *  line, by coincidence of hardware history, as the first eSIM iPhone. */
const FIRST_ESIM_ONLY_IOS = 17

export function iosMajorFromUA(ua: string): number | null {
  if (!/iPhone/.test(ua)) return null
  const match = /OS (\d+)[_.]/.exec(ua)
  return match ? Number(match[1]) : null
}

export async function detectDevice(): Promise<DeviceHint | null> {
  if (typeof navigator === 'undefined') return null

  const uaData = (navigator as Navigator & { userAgentData?: HighEntropyUA }).userAgentData
  if (uaData?.getHighEntropyValues) {
    try {
      const values = await uaData.getHighEntropyValues(['model', 'platform'])
      const model = values.model?.trim()
      // Desktop Chrome answers with an empty model, which is not a hint.
      if (model) return { kind: 'model', model }
    } catch {
      // Permission policy can refuse high-entropy hints. Fall through.
    }
  }

  const major = iosMajorFromUA(navigator.userAgent)
  if (major !== null && major >= FIRST_ESIM_ONLY_IOS) return { kind: 'ios', version: major }

  return null
}
