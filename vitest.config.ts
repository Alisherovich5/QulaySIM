import { defineConfig } from 'vitest/config'

/**
 * Unit tests only, and only from src/.
 *
 * Vitest's default pattern also matches `e2e/smoke.spec.ts`, which is a
 * Playwright file — it fails immediately with a confusing message about
 * `beforeEach`, and the real problem is that two runners were both claiming the
 * same file. One boundary, stated once.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
