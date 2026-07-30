# Accepted advisories

`npm audit` reports findings that do not apply to how this application is built.
Each is recorded here with the reason, so an audit does not have to re-derive it
and nobody upgrades across a major version for a risk that is not present.

Re-check an entry whenever the surrounding code changes in the way the reason
depends on.

## GHSA-qwww-vcr4-c8h2 — react-router, "RSC Mode CSRF Bypass"

- **Affects** `react-router` `>=7.12.0 <8.3.0`; installed `7.18.0`.
- **Not applicable.** The advisory is specific to React Server Components mode.
  This app is a client-side SPA: `src/App.tsx` uses `<BrowserRouter>` with plain
  `<Routes>`, and there is no `createBrowserRouter`, no `RouterProvider`, and no
  route `loader`/`action` anywhere in `src/`. There is no server route handling
  for the bypass to reach.
- **Why not upgrade anyway.** The fix is `8.3.0`, a major version. npm's
  suggested `7.11.0` is a *downgrade* to before the vulnerable range. Either is
  churn with real regression risk in routing, traded for no reduction in
  exposure.
- **Re-check if** the app adopts RSC mode, data routers, or route actions.

## d3-color ReDoS (via react-globe.gl → three-globe)

- **Reported and then not**, depending on how the transitive range resolves.
  Worth recording because there is nothing to upgrade to: `d3-color`'s latest
  published version *is* the flagged `3.1.0`.
- **Not exploitable here.** A ReDoS needs attacker-controlled input to reach the
  colour parser. The globe is fed fixed colours from `HeroGlobe.tsx` and country
  geometry from a static `world-110m.json` we ship; no user input is parsed as a
  colour anywhere in the app.
- **Re-check if** the globe ever colours features from API or user data.

## Verifying the reason still holds

```sh
# Should print nothing. If it prints a file, this note is out of date.
grep -rlE "createBrowserRouter|RouterProvider|unstable_|\bloader:|\baction:" src/
```
