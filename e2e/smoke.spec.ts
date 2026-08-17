import { expect, test, type Page } from '@playwright/test'

/**
 * The three flows worth a browser.
 *
 * Everything here is mocked at the network boundary, so a failure means the
 * storefront broke — not that Postgres was down or a supplier was slow.
 */

const COUNTRIES = [
  { id: 1, name: 'Turkiya', slug: 'turkey', iso2: 'TR', starting_price: 1.5, is_popular: true, region: { id: 1, name: 'Yevropa', slug: 'europe' } },
  { id: 2, name: 'Gruziya', slug: 'georgia', iso2: 'GE', starting_price: 2, is_popular: true, region: { id: 1, name: 'Yevropa', slug: 'europe' } },
]

const PLANS = [
  { id: 10, scope: 'local', title: 'Turkey 3 GB · 7 days', data_amount_mb: 3072, is_unlimited: false, data_label: '3 GB', validity_days: 7, price_usd: 4.5, price_note: '', network_type: '5G', supports_hotspot: true, is_popular: true, coverage: [] },
  { id: 11, scope: 'local', title: 'Turkey 10 GB · 30 days', data_amount_mb: 10240, is_unlimited: false, data_label: '10 GB', validity_days: 30, price_usd: 9.5, price_note: '', network_type: '5G', supports_hotspot: true, is_popular: false, coverage: [] },
]

/** Every endpoint the storefront can ask for, answered from memory. */
async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace(/^\/api/, '')
    const json = (body: unknown) => route.fulfill({ json: body })

    if (path === '/countries') return json(COUNTRIES)
    if (path.startsWith('/countries/')) {
      const slug = path.split('/')[2]
      const country = COUNTRIES.find((c) => c.slug === slug)
      return country ? json({ ...country, plans: PLANS }) : route.fulfill({ status: 404, json: {} })
    }
    if (path === '/regions') return json([{ id: 1, name: 'Yevropa', slug: 'europe', country_count: 55, starting_price: 1.5 }])
    if (path.startsWith('/regions/')) return json({ id: 1, name: 'Global', slug: 'global', country_count: 0, starting_price: 10.5, plans: [] })
    if (path === '/currency') return json({ usd_to_uzs: 12500, source: 'cbu' })
    if (path === '/auth/me') return route.fulfill({ status: 401, json: {} })
    if (path === '/auth/providers') return json({ password: true, google: false })
    if (path === '/checkout/quote') {
      return json({
        subtotal: 4.5, discount: 0, total: 4.5, promo_applied: false, promo_message: null,
        promo_reason: null, promo_min_order_usd: null,
        lines: [{ plan_id: 10, title: 'Turkey 3 GB · 7 days', unit_price: 4.5, quantity: 1, line_total: 4.5 }],
      })
    }
    if (path === '/rum') return route.fulfill({ status: 204, body: '' })
    // Anything unmocked answers empty rather than hanging: a test that times
    // out tells you nothing about which call was missing.
    return json({})
  })
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('a customer can go from a destination to the cart', async ({ page }) => {
  await page.goto('/destinations/turkey')

  // The prices are baked into the prerendered HTML, so they are on screen
  // before any request resolves — the assertion is deliberately made without
  // waiting for network idle.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turkiya')
  await expect(page.getByText('3 GB').first()).toBeVisible()

  await page.getByRole('button', { name: /savatga|qo‘shish|qo'shish/i }).first().click()

  // The cart survives the navigation, which is the part that breaks when
  // storage keys or contexts are refactored.
  await page.goto('/checkout')
  await expect(page.getByText(/3 GB|Turkey 3 GB/).first()).toBeVisible()
})

test('the language prefix decides the edition, whatever is stored', async ({ page }) => {
  // A visitor whose stored preference is Uzbek must still get Russian on a
  // /ru/ URL — this is also what stops Googlebot indexing three identical
  // Uzbek pages under three addresses.
  await page.goto('/')
  await page.goto('/ru/destinations')

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Направлени|Страны/i)
})

test('the worldwide filter narrows by country', async ({ page }) => {
  // The filter that stops a customer buying a bundle that omits their stop.
  await page.route('**/api/regions/global', (route) =>
    route.fulfill({
      json: {
        id: 8, name: 'Global', slug: 'global', country_count: 0, starting_price: 10.5,
        plans: [
          { ...PLANS[0], id: 20, scope: 'global', title: 'Global 3 GB · 30 days', coverage: ['TR', 'GE'] },
          { ...PLANS[1], id: 21, scope: 'global', title: 'Global 10 GB · 30 days', coverage: ['GE'] },
        ],
      },
    }),
  )
  await page.goto('/global')

  await expect(page.getByText(/2 tarifdan 2 tasi/)).toBeVisible()
  await page.getByPlaceholder(/qaysi davlatga/i).fill('Turkiya')
  await page.getByRole('button', { name: /Turkiya/ }).first().click()

  // One plan covers Turkey, the other does not — and the one that does not is
  // removed rather than quietly ranked lower.
  await expect(page.getByText(/2 tarifdan 1 tasi/)).toBeVisible()
})
