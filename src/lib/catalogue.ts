/**
 * What a page should hold after asking the API for the catalogue.
 *
 * Every catalogue page does the same three things: start from the copy baked
 * into its HTML at build time, ask for a fresher one, and keep what it has when
 * the answer does not arrive. That third step is the whole difficulty. Written
 * out by hand at each call site it was wrong at two of six — the home page
 * replaced its baked countries with an empty list, the hero's globe never read
 * the baked copy — and both read to a customer as "the countries disappeared",
 * on a link where a dropped request is a coin flip.
 *
 * The decision is one function so it can be stated once and tested
 * exhaustively; `useCatalogue` is the ten lines of wiring around it.
 */

/** What came back from asking. */
export type Outcome<T> =
  /** An answer arrived. An empty one is still an answer. */
  | { kind: 'ok'; data: T }
  /** Nothing arrived: dropped, refused, timed out. Says nothing about the data. */
  | { kind: 'failed' }
  /** The API answered that this thing does not exist (404). */
  | { kind: 'missing' }

export interface Rules {
  /**
   * Whether a genuine 404 should empty the page.
   *
   * True on a single destination — one deleted in the admin must stop
   * rendering. False on a list, where 404 is not a meaningful answer and
   * blanking the page would be a worse lie than showing yesterday's list.
   */
  clearOnMissing?: boolean
}

export function nextData<T>(current: T | null, outcome: Outcome<T>, rules: Rules = {}): T | null {
  switch (outcome.kind) {
    case 'ok':
      return outcome.data
    case 'missing':
      return rules.clearOnMissing ? null : current
    case 'failed':
      // The rule. A lost request is not an answer, so it changes nothing.
      return current
  }
}
