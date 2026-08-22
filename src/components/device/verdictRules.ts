import type { EsimDevice } from '../../data/esimDevices'

/* The verdict itself, and the one animation the device check uses.
 *
 * Separate from shared.tsx because a file that exports both components and
 * constants breaks Fast Refresh — the components reload, the constants do not,
 * and the two disagree until a full reload. */

export const REVEAL = 'motion-safe:animate-[fs-rise_0.42s_ease-out_backwards]'

export type Verdict = 'yes' | 'regional' | 'no'

export const verdictOf = (device: EsimDevice): Verdict =>
  !device.compatible ? 'no' : device.note === 'regional' ? 'regional' : 'yes'

/** The one mark that repeats everywhere on this page: a filled dot for yes, a
 *  ring for maybe, a slash for no. Never colour alone — each carries a glyph. */
