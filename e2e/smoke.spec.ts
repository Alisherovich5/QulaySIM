import { expect, test, type Page } from '@playwright/test'

/**
 * The flows worth a browser, and each earned its place by breaking once.
 *
 * Everything is mocked at the network boundary, so a failure means the storefront
 * broke — not that Postgres was down or a supplier was slow.
 */

const COUNTRIES = [
  {
    id: 1,
    name: 'Turkiya',
    slug: 'turkey',
    iso2: 'TR',
    starting_price: 1.5,
    is_popular: true,
    region: { id: 1, name: 'Yevropa', slug: 'europe' },
  },
  {
    id: 2,
    name: 'Gruziya',
    slug: 'georgia',
    iso2: 'GE',
    starting_price: 2,
    is_popular: true,
    region: { id: 1, name: 'Yevropa', slug: 'europe' },
  },
]

const PLANS = [
  {
    id: 10,
    scope: 'local',
    title: 'Turkey 3 GB · 7 days',
    data_amount_mb: 3072,
    is_unlimited: false,
    data_label: '3 GB',
    validity_days: 7,
    price_usd: 4.5,
    price_note: '',
    network_type: '5G',
    supports_hotspot: true,
    is_popular: true,
    coverage: [],
  },
  {
    id: 11,
    scope: 'local',
    title: 'Turkey 10 GB · 30 days',
    data_amount_mb: 10240,
    is_unlimited: false,
    data_label: '10 GB',
    validity_days: 30,
    price_usd: 9.5,
    price_note: '',
    network_type: '5G',
    supports_hotspot: true,
    is_popular: false,
    coverage: [],
  },
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
    if (path === '/regions')
      return json([
        { id: 1, name: 'Yevropa', slug: 'europe', country_count: 55, starting_price: 1.5 },
      ])
    if (path.startsWith('/regions/'))
      return json({
        id: 1,
        name: 'Global',
        slug: 'global',
        country_count: 0,
        starting_price: 10.5,
        plans: [],
      })
    if (path === '/currency') return json({ usd_to_uzs: 12500, source: 'cbu' })
    if (path === '/auth/me') return route.fulfill({ status: 401, json: {} })
    if (path === '/auth/providers') return json({ password: true, google: false })
    if (path === '/checkout/quote') {
      return json({
        subtotal: 4.5,
        discount: 0,
        total: 4.5,
        promo_applied: false,
        promo_message: null,
        promo_reason: null,
        promo_min_order_usd: null,
        lines: [
          {
            plan_id: 10,
            title: 'Turkey 3 GB · 7 days',
            unit_price: 4.5,
            quantity: 1,
            line_total: 4.5,
          },
        ],
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

  await page
    .getByRole('button', { name: /Tarifni tanlash/i })
    .first()
    .click()

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
  // The destinations heading, in Russian. Any Russian-only string proves the
  // point; this one is the page's own h1, so it also fails if the heading stops
  // being an h1 — which is what a crawler reads first.
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Выберите мир/i)
})

test('the worldwide filter narrows by country', async ({ page }) => {
  // The filter that stops a customer buying a bundle that omits their stop.
  await page.route('**/api/regions/global*', (route) =>
    route.fulfill({
      json: {
        id: 8,
        name: 'Global',
        slug: 'global',
        country_count: 0,
        starting_price: 10.5,
        plans: [
          {
            ...PLANS[0],
            id: 20,
            scope: 'global',
            title: 'Global 3 GB · 30 days',
            coverage: ['TR', 'GE'],
          },
          {
            ...PLANS[1],
            id: 21,
            scope: 'global',
            title: 'Global 10 GB · 30 days',
            coverage: ['GE'],
          },
        ],
      },
    }),
  )
  await page.goto('/global')

  await expect(page.getByText(/2 tarifdan 2 tasi/)).toBeVisible()
  await page.getByPlaceholder(/qaysi davlatga/i).fill('Turkiya')
  await page
    .getByRole('button', { name: /Turkiya/ })
    .first()
    .click()

  // One plan covers Turkey, the other does not — and the one that does not is
  // removed rather than quietly ranked lower.
  await expect(page.getByText(/2 tarifdan 1 tasi/)).toBeVisible()
})

test('the region filter never offers a region that empties the page', async ({ page }) => {
  // What "the countries disappeared" turned out to mean: the worldwide region
  // holds plans rather than countries, so picking it filtered the catalogue down
  // to nothing. It is now offered as what it is — a different page.
  await page.route('**/api/regions*', (route) =>
    route.fulfill({
      json: [
        { id: 1, name: 'Yevropa', slug: 'europe', country_count: 55, starting_price: 1.5 },
        { id: 8, name: 'Butun dunyo', slug: 'global', country_count: 0, starting_price: 10.5 },
      ],
    }),
  )
  // The catalogue, not the /regions list, is what decides the rail — so it is
  // the catalogue this test has to pin. Without it the page keeps the countries
  // baked into the prerendered HTML, which span every region.
  await page.route('**/api/countries*', (route) => route.fulfill({ json: COUNTRIES }))
  await page.goto('/destinations')
  // The regions are a rail in the sidebar now rather than a <select> or chips,
  // and the rule they follow is the same one — with a wider reach. It is not
  // the /regions response that decides what is offered but the catalogue: a
  // rail entry appears only when a country in this fixture belongs to it. Both
  // countries here are European, so Europe is offered and the other five are
  // not, and none of them can be picked into an empty page.
  // On a phone the sidebar is a sheet, so the rail has to be opened before it
  // can be read. Same rail, same rule, one tap further in.
  await expect(page.locator('.dx-ticket').first()).toBeVisible()
  const opener = page.getByRole('button', { name: 'Mintaqalar', exact: true })
  if (await opener.isVisible()) await opener.click()
  // `:visible` because the sidebar's own copy of the rail is still in the DOM
  // behind `display: none` at this width, and an invisible button is one a click
  // waits on forever.
  const rail = page.locator('nav[aria-label="Mintaqalar"]:visible')
  await expect(rail.getByRole('button', { name: 'Yevropa' })).toHaveCount(1)
  await expect(rail.getByRole('button', { name: 'Butun dunyo' })).toHaveCount(0)
  await expect(rail.getByRole('button', { name: 'Osiyo' })).toHaveCount(0)
  // And the one that is offered lands on something.
  await rail.getByRole('button', { name: 'Yevropa' }).click()
  await expect(page.locator('.dx-ticket').first()).toBeVisible()
  // Offered instead as a link to the page that actually sells those plans.
  await expect(page.getByRole('link', { name: /Butun dunyo|dunyo bo/i }).first()).toHaveAttribute(
    'href',
    '/global',
  )
})

test('the device check answers by typing, and refuses to overstate', async ({ page }) => {
  // The page a customer reaches before spending anything, so both directions of
  // being wrong are expensive: telling somebody with a Redmi Note that it works
  // costs a refund, and telling an iPhone 13 owner it does not costs the sale.
  await page.goto('/device-check')

  const search = page.getByRole('combobox')
  await search.fill('Redmi Note 13')
  await page.getByRole('option').first().click()
  await expect(page.getByRole('heading', { name: 'Xiaomi Redmi Note 13' })).toBeVisible()
  await expect(page.getByText(/eSIM moduli yo‘q/)).toBeVisible()

  await search.fill('iPhone 13')
  // Keyboard, because the suggestion list is a combobox and the first thing a
  // desktop visitor does after typing is press Enter.
  await search.press('Enter')
  await expect(page.getByRole('heading', { name: 'Apple iPhone 13' })).toBeVisible()
  await expect(page.getByText(/eSIM ishlaydi/)).toBeVisible()
  // A model sold in both forms says so; nothing on this page turns "probably"
  // into "yes".
  await expect(page.getByText(/\*#06#/).first()).toBeVisible()

  // The certain method is still here, one tap in.
  await page.getByRole('button', { name: /Telefonning o‘zidan tekshirish/ }).click()
  await expect(page.getByLabel(/\*#06#/).first()).toBeVisible()
})

test('a dropped catalogue request never empties a page that was baked with one', async ({
  page,
}) => {
  // Twice reported as "the countries disappeared", and this is the mechanism:
  // the home page carries its catalogue in the HTML, then replaced it with the
  // empty state as soon as one request was lost. On a link measured at 40%
  // packet loss that is a coin flip on every visit.
  await page.route('**/api/countries*', (route) => route.abort())
  await page.goto('/')

  const cards = page.locator('a[href*="/destinations/"]')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThan(0)
  await expect(page.getByText(/hozircha yo‘nalish yo‘q/)).toHaveCount(0)
})

test('the globe keeps its countries when the catalogue request is lost', async ({ page }) => {
  // The second call site that got this wrong, and the one the browser had to
  // catch: the hero read the catalogue from the network only, so a dropped
  // request left the globe with nothing raised. Reported as "the countries on
  // the globe have gone down". Both call sites go through useCatalogue now, and
  // this asserts the one a unit test cannot reach.
  await page.route('**/api/countries*', (route) => route.abort())
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  // The hero's quick links are drawn from the same list the globe raises, so
  // they are the visible proof that the baked copy survived the failure. Scoped
  // to that list by name: an unscoped locator also matched the popular-
  // destinations grid further down the page, so it passed while the hero was
  // empty — checked by removing the seed and watching this test go red.
  const quick = page.getByLabel('Tez yo‘nalishlar').locator('a[href^="/destinations/"]')
  await expect(quick.first()).toBeVisible()
  expect(await quick.count()).toBeGreaterThan(0)
})

/** The language button carries an aria-label, so its name follows the UI language. */
const LANGUAGE_BUTTON = /^(Til|Language|Язык)$/

test('the header keeps its currency, theme and language controls', async ({ page }) => {
  await page.goto('/destinations')
  const header = page.locator('.site-header')

  // Currency: one pair of buttons on desktop, a single toggle on a phone —
  // either way the other currency has to be reachable afterwards.
  await header
    .getByRole('button', { name: /USD/ })
    .first()
    .click()
  await expect(header.getByRole('button', { name: /UZS/ }).first()).toBeVisible()

  await header.getByRole('button', { name: /Tungi rejim/ }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await header.getByRole('button', { name: /Kunduzgi rejim/ }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  // Escape closes the language list and puts focus back where it started.
  const language = header.getByRole('button', { name: LANGUAGE_BUTTON })
  await language.click()
  await expect(language).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(language).toHaveAttribute('aria-expanded', 'false')
  await expect(language).toBeFocused()

  await expect(header.getByRole('link', { name: 'Cart' })).toBeVisible()
})

test('the header changes language without losing the page', async ({ page }) => {
  await page.goto('/destinations/turkey')
  await page.locator('.site-header').getByRole('button', { name: LANGUAGE_BUTTON }).click()
  await page.getByRole('button', { name: 'Русский' }).click()
  await expect(page).toHaveURL(/\/ru\/destinations\/turkey$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  // The API fixture deliberately keeps its Uzbek country name; page copy is translated locally.
  await expect(page.getByRole('button', { name: 'Выбрать тариф', exact: true })).toBeVisible()
})

test('the header fits every width with a filled cart', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/destinations/turkey')
  await page
    .getByRole('button', { name: /Tarifni tanlash/i })
    .first()
    .click()

  const header = page.locator('.site-header')
  await expect(header.getByRole('link', { name: 'Cart' })).toBeVisible()
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    // Nothing in the bar may push it wider than the screen at any width.
    await expect
      .poll(() => header.evaluate((bar) => bar.scrollWidth <= bar.clientWidth + 1))
      .toBe(true)
    await header.getByRole('button', { name: LANGUAGE_BUTTON }).click()
    const list = page.getByRole('button', { name: "O'zbekcha" }).first()
    const bounds = await list.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await page.keyboard.press('Escape')
  }
})

test('Uzbek can be selected on an unprefixed page with another stored language', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('fastsim_lang', 'en'))
  await page.goto('/destinations/turkey')
  await expect(page.getByRole('button', { name: 'Choose plan', exact: true })).toBeVisible()
  await page.locator('.site-header').getByRole('button', { name: LANGUAGE_BUTTON }).click()
  await page.getByRole('button', { name: "O'zbekcha" }).click()
  await expect(page).toHaveURL(/\/destinations\/turkey$/)
  await expect(page.getByRole('button', { name: 'Tarifni tanlash', exact: true })).toBeVisible()
})

test('the route planner sells only the plans that cover the whole trip', async ({ page }) => {
  // The rule this page turns on, end to end: coverage removes a plan rather
  // than ranking it lower. The cheap bundle here misses France on purpose —
  // that is exactly how a customer ends up in Paris with no data.
  await page.route('**/api/countries*', (route) =>
    route.fulfill({
      json: [
        { id: 1, name: 'Turkiya', slug: 'turkiya', iso2: 'TR', is_popular: true, region: null, starting_price: 1 },
        { id: 2, name: 'Italiya', slug: 'italiya', iso2: 'IT', is_popular: true, region: null, starting_price: 1 },
        { id: 3, name: 'Fransiya', slug: 'fransiya', iso2: 'FR', is_popular: true, region: null, starting_price: 1 },
        { id: 4, name: 'Yaponiya', slug: 'yaponiya', iso2: 'JP', is_popular: false, region: null, starting_price: 1 },
      ],
    }),
  )
  await page.route('**/api/regions/global*', (route) =>
    route.fulfill({
      json: {
        id: 8,
        name: 'Global',
        slug: 'global',
        country_count: 0,
        starting_price: 5,
        plans: [
          {
            id: 1, scope: 'global', title: 'Global 3 GB', data_amount_mb: 3072, is_unlimited: false,
            data_label: '3 GB', validity_days: 7, price_usd: 18, price_note: '', network_type: '5G',
            supports_hotspot: true, is_popular: false, coverage: ['TR', 'IT', 'FR', 'JP'],
          },
          {
            id: 2, scope: 'global', title: 'Yevropa 1 GB', data_amount_mb: 1024, is_unlimited: false,
            data_label: '1 GB', validity_days: 7, price_usd: 9, price_note: '', network_type: '4G',
            supports_hotspot: true, is_popular: false, coverage: ['TR', 'IT'],
          },
        ],
      },
    }),
  )

  await page.goto('/marshrut')
  // Turkey, Italy, France are on the itinerary to begin with, so the bundle
  // that stops at Italy must not be on the page at all.
  await expect(page.locator('.rp-card')).toHaveCount(1)
  await expect(page.locator('.rp-card')).toContainText('3 GB')
  await expect(page.locator('.rp-badge')).toContainText('3 ta davlat')

  // Drop France and the cheaper, narrower bundle becomes honest to sell.
  await page.getByRole('button', { name: 'Fransiyani olib tashlash' }).click()
  await expect(page.locator('.rp-card')).toHaveCount(2)

  // A country already chosen cannot be chosen twice.
  await page.getByRole('button', { name: /Davlat qo.shish/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: /Turkiya/ })).toBeDisabled()
  await dialog.getByRole('button', { name: /Yaponiya/ }).click()
  await expect(page.locator('.rp-chip')).toHaveCount(3)
  // Japan is outside the narrow bundle, so it leaves again.
  await expect(page.locator('.rp-card')).toHaveCount(1)

  // Escape closes the dialog rather than trapping the visitor in it.
  await page.getByRole('button', { name: /Davlat qo.shish/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('choosing a plan offers the two answers instead of deciding for you', async ({ page }) => {
  // Feedback from the shop floor, 2026-09-19: tapping a tariff used to throw
  // the customer into checkout 350 ms later, so comparing a 5 GB against a
  // 10 GB was impossible — the first tap ended the comparison. And before
  // that, the only way forward sat at the bottom of a twenty-row list.
  await page.route('**/api/countries/*', (route) =>
    route.fulfill({
      json: {
        id: 1, name: 'Vietnam', slug: 'vietnam', iso2: 'VN', is_popular: true,
        region: null, starting_price: 2.2,
        plans: [
          {
            id: 11, scope: 'country', title: 'Vietnam 3 GB', data_amount_mb: 3072,
            is_unlimited: false, data_label: '3 GB', validity_days: 15, price_usd: 5,
            price_note: '', network_type: '5G', supports_hotspot: true, is_popular: true,
          },
          {
            id: 12, scope: 'country', title: 'Vietnam 5 GB', data_amount_mb: 5120,
            is_unlimited: false, data_label: '5 GB', validity_days: 30, price_usd: 9,
            price_note: '', network_type: '5G', supports_hotspot: true, is_popular: false,
          },
        ],
      },
    }),
  )
  await page.goto('/destinations/vietnam')
  await page.getByRole('button', { name: 'Tarifni tanlash' }).first().click()

  // The page it was on is the page it stays on.
  await expect(page.locator('.cart-bar')).toBeVisible()
  await expect(page).not.toHaveURL(/checkout/)

  // "Keep choosing" puts the list back, with the comparison still on screen —
  // which is the whole point: the 5 GB the customer was weighing up is still
  // one tap away.
  await page.locator('.cart-bar__more').click()
  await expect(page.locator('.cart-bar')).toHaveCount(0)
  await expect(page.getByText('Vietnam 5 GB', { exact: false }).first()).toBeVisible()

  // And the other answer still works: pick the one they were comparing, then go.
  await page.getByText('Vietnam 5 GB', { exact: false }).first().click()
  await page.getByRole('button', { name: 'Tarifni tanlash' }).first().click()
  await page.locator('.cart-bar__go').click()
  await expect(page).toHaveURL(/checkout/)
})

test('minus removes the last one instead of refusing', async ({ page }) => {
  // Pressing minus until it is gone is what people do; it used to stop at one
  // and send them hunting for a bin icon, which is a second control for the
  // same intention.
  await page.route('**/api/countries/*', (route) =>
    route.fulfill({
      json: {
        id: 1, name: 'Vietnam', slug: 'vietnam', iso2: 'VN', is_popular: true,
        region: null, starting_price: 5,
        plans: [
          {
            id: 11, scope: 'country', title: 'Vietnam 3 GB', data_amount_mb: 3072,
            is_unlimited: false, data_label: '3 GB', validity_days: 15, price_usd: 5,
            price_note: '', network_type: '5G', supports_hotspot: true, is_popular: true,
          },
        ],
      },
    }),
  )
  await page.goto('/destinations/vietnam')
  await page.getByRole('button', { name: 'Tarifni tanlash' }).first().click()
  await page.locator('.cart-bar__go').click()
  await expect(page).toHaveURL(/checkout/)

  const minus = page.locator('.lucide-minus')
  await expect(minus).toHaveCount(1)
  await minus.click()
  await expect(minus).toHaveCount(0)
})

test('a paid order moves to the eSIMs without the customer closing anything', async ({ page }) => {
  // "To'lov qildi, kutib turish kerak o'zi... yana o'chirib tashlab qaytadan
  // kirishingiz kerak bo'ladi-da" — 2026-09-19. The screen already went to the
  // account, but only for somebody who closed the payment window themselves
  // and only if the provider's callback beat a 4.5 s clock. This is the other
  // customer: the one who pays and then waits.
  await page.route('**/api/countries/*', (route) =>
    route.fulfill({
      json: {
        id: 1, name: 'Vietnam', slug: 'vietnam', iso2: 'VN', is_popular: true,
        region: null, starting_price: 5,
        plans: [
          {
            id: 11, scope: 'country', title: 'Vietnam 3 GB', data_amount_mb: 3072,
            is_unlimited: false, data_label: '3 GB', validity_days: 15, price_usd: 5,
            price_note: '', network_type: '5G', supports_hotspot: true, is_popular: true,
          },
        ],
      },
    }),
  )
  // A signed-in customer, faked at the two doors the app actually checks: the
  // session cookie it looks for before spending a round trip, and the refresh
  // that turns it into an access token. Without this the checkout button reads
  // "sign in to pay" and the payment path is never reached — which is how this
  // test would have passed while testing nothing.
  await page.context().addCookies([
    { name: 'qs_session', value: 'e2e', domain: '127.0.0.1', path: '/' },
  ])
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ json: { access_token: 'e2e-token' } }),
  )
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { id: 1, email: 'test@qulaysim.uz', full_name: 'Test' } }),
  )
  await page.route('**/api/checkout', (route) =>
    route.fulfill({ json: { order_id: 4242, payment_url: 'about:blank' } }),
  )
  // The money lands a few seconds after the window opens, which is what a card
  // payment actually looks like.
  const opened = Date.now()
  await page.route('**/api/account/orders', (route) =>
    route.fulfill({ json: Date.now() - opened > 5000 ? [{ id: 4242 }] : [] }),
  )

  await page.goto('/destinations/vietnam')
  await page.getByRole('button', { name: 'Tarifni tanlash' }).first().click()
  await page.locator('.cart-bar__go').click()
  await expect(page).toHaveURL(/checkout/)

  // Exactly the pay button, never the "sign in to pay" one it turns into for a
  // signed-out visitor — matching loosely is how a test like this quietly
  // stops testing anything.
  const pay = page.getByRole('button', { name: 'Karta bilan to\u2018lash' })
  await expect(pay).toBeVisible()
  await pay.click()

  // Nothing is closed, nothing is tapped: the page moves on its own.
  await expect(page).toHaveURL(/\/account/, { timeout: 30000 })
})

/**
 * A destination page must not throw away the prices the build baked into it.
 *
 * The page seeds itself from a `__DATA__` block so the tariffs are on screen in
 * the first frame. It also returned early while `loading` was true — which is
 * every first render, seed or no seed — so it drew a one-line "loading plans",
 * waited for the network, then grew to five thousand pixels. Cumulative layout
 * shift measured 0.73 on every destination page; 0.1 is the threshold for
 * "good", and destination pages are what search sends people to.
 *
 * The API is delayed deliberately. With the regression back, nothing but the
 * loading line is on screen for those two seconds.
 */
test('a destination shows its baked prices before the API answers', async ({ page }) => {
  await page.route('**/api/countries/turkey*', async (route) => {
    await new Promise((r) => setTimeout(r, 2000))
    await route.fulfill({
      status: 200,
      json: { ...COUNTRIES[0], plans: PLANS },
    })
  })

  await page.goto('/destinations/turkey')

  // Before the delayed answer: the country and its tariffs, from the page itself.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turkiya', { timeout: 1500 })
  await expect(page.getByText(/1 GB/).first()).toBeVisible({ timeout: 1500 })

  const shift = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEntry[] &
            { hadRecentInput?: boolean; value?: number }[]) {
            if (!entry.hadRecentInput) total += entry.value ?? 0
          }
        }).observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => resolve(total), 3000)
      }),
  )
  // 0.1 is Google's "good". The regression measured 0.73.
  expect(shift).toBeLessThan(0.1)
})
