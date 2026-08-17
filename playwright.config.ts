import { defineConfig, devices } from '@playwright/test'

/**
 * Three smoke flows, and deliberately only three.
 *
 * A large end-to-end suite in a one-person project becomes a suite nobody runs:
 * slow, flaky, and eventually skipped. These cover the paths where a break costs
 * money — a customer who cannot reach checkout, a customer sent to the wrong
 * language edition — and nothing else.
 *
 * The API is mocked at the network boundary rather than run alongside. The point
 * here is the storefront's own behaviour; the backend has its own 449 tests, and
 * a browser test that needs Postgres to be up is a test that fails for reasons
 * that have nothing to do with the browser.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // The built site served the way nginx serves it. `vite preview` answers
    // every unknown path with index.html, so the prerendered pages and the
    // catalogue baked into them would never be served — which is most of what
    // these tests check.
    command: 'node scripts/serve-dist.mjs 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
