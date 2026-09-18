/**
 * Every colour the WebGL globe is made of, for one theme.
 *
 * Lives in lib because two places draw the same planet now — the account page,
 * where the customer turns it to see where they have been, and the destinations
 * picker, where it is the catalogue. A second copy of these numbers is a second
 * planet that slowly stops matching the first, which is exactly how the old
 * "not available" swatch ended up a different grey from the continents it was
 * meant to describe.
 *
 * These are WebGL material colours. three.js needs literal values — it cannot
 * read `var(--color-…)` the way the rest of the system does.
 */
export interface GlobePalette {
  /** CSS background for the panel the sphere floats in. */
  space: string
  /** Recessed inner shadow, so the panel reads as a window rather than a hole. */
  inset: string
  /** Sphere base colour (the ocean). */
  ocean: string
  /** Self-lit floor, so the unlit limb never fades into the backdrop. */
  oceanEmissive: string
  oceanSpecular: string
  /** Halo — soft edge instead of a cut-out circle. */
  atmosphere: string
  atmosphereAltitude: number
  visited: string
  available: string
  availableHover: string
  visitedHover: string
  /** Countries we do not serve. */
  disabled: string
  /** Country borders, engraved rather than drawn on. */
  stroke: string
}

/**
 * Dark: the planet is the only lit thing in the frame.
 * Light: the same planet seen by day — deep water against a pale sky, which
 *        keeps a bright card from having a black rectangle punched out of it.
 */
export const GLOBE_THEME: Record<'light' | 'dark', GlobePalette> = {
  dark: {
    space:
      'radial-gradient(118% 82% at 50% 38%, #0b2f3c 0%, #06202b 34%, #03121a 66%, #010a0f 100%)',
    inset: 'inset 0 12px 32px -16px #000, inset 0 -12px 32px -18px #000',
    ocean: '#12495c',
    oceanEmissive: '#03151d',
    oceanSpecular: '#0d6b78',
    atmosphere: '#5cc2b3',
    atmosphereAltitude: 0.24,
    visited: '#008e7c',
    visitedHover: '#00b39c',
    available: '#34e3b0',
    availableHover: '#8bf5d8',
    disabled: '#24505e',
    stroke: '#071f29',
  },
  light: {
    space:
      'radial-gradient(118% 82% at 50% 38%, #f6fcfb 0%, #e7f3f5 38%, #d3e6ed 72%, #c1d9e4 100%)',
    inset:
      'inset 0 12px 30px -18px rgba(9,48,60,.55), inset 0 -10px 26px -20px rgba(9,48,60,.45)',
    ocean: '#0f4c5c',
    oceanEmissive: '#04212b',
    oceanSpecular: '#1b7f8c',
    atmosphere: '#1aa28e',
    atmosphereAltitude: 0.2,
    visited: '#007365',
    visitedHover: '#008e7c',
    available: '#10b981',
    availableHover: '#34e3b0',
    disabled: '#5b7f8e',
    stroke: '#093542',
  },
}

