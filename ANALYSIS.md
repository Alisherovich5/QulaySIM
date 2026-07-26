# QulaySIM — To'liq Texnik Audit

Sana: 2026-07-26 · Commit: `bb0d72f` · 68 fayl, ~6 970 qator TS/TSX

---

## 0. Eng muhim narsa: bu Redis/Celery/Docker loyihasi emas

Repo — **sof frontend**: React 19 + Vite 8 + TypeScript 6 + Tailwind 4. Backend
bu repoda umuman yo'q. Uni faqat `vite.config.ts` dagi proxy orqali ko'rish mumkin:

```
/api → http://127.0.0.1:8000
```

Backend imzolari FastAPI ekanini ko'rsatadi (`/auth/login` OAuth2 form-encoded,
xato formati `{detail: "..."}`). Ya'ni **Redis, Celery, Docker, worker, queue —
hammasi boshqa repoda**. Ularni tahlil qilish uchun backend reposi kerak.

Quyidagi audit shu frontend uchun.

---

## 1. Haqiqiy xatolar (foydalanuvchi ko'radi)

### 1.1 Bosh sahifada tarjima kaliti xom ko'rinadi — P0
`src/components/home/DestinationsExplorer.tsx:72` `t('destinations.mostPopular')`
chaqiradi, lekin bu kalit **uch tilning hech birida yo'q**. Natijada mashhur
davlat kartochkasida "Most popular" o'rniga literal `destinations.mostPopular`
matni chiqadi (desktop, `sm:` breakpoint'dan yuqori).

Mavjud kalit `plan.mostPopular` — noto'g'ri namespace ishlatilgan.

**Tuzatish:** `t('plan.mostPopular')` ga o'zgartirish yoki `destinations`
namespace'iga kalit qo'shish (3 tilga).

### 1.2 Calculator sahifasi — 326 qator buzuq o'lik kod — P1
`src/pages/Calculator.tsx` hech qayerda route qilinmagan va **23 ta `calc.*`
tarjima kaliti hech bir tilda mavjud emas**. Agar hozir route qo'shilsa, sahifa
to'liq xom kalitlar bilan renderlanadi (`calc.title`, `calc.step1`, ...).

Ikki yo'ldan biri: o'chirish, yoki 23 kalitni 3 tilga yozib route qo'shish.

### 1.3 Ushlanmagan promise rejection — P1
Quyidagi joylarda API xatosi hech qanday `.catch` ga tushmaydi:

| Fayl | Qator | Oqibat |
|---|---|---|
| `pages/Account.tsx` | 75, 87 | `activate`/`topup` — `try/finally` bor, `catch` yo'q. Xato bo'lsa spinner o'chadi, lekin foydalanuvchiga hech narsa aytilmaydi |
| `components/account/ReferralPanel.tsx` | 14 | Skeleton **abadiy** aylanadi — `data` hech qachon o'rnatilmaydi |
| `pages/Destinations.tsx` | 21 | Region filtrlari jim yo'qoladi |
| `components/home/DestinationsExplorer.tsx` | 21, 22 | Bosh sahifa bo'limi jim bo'sh qoladi |

Eng yomoni ReferralPanel — bu xatolik holatida sahifa hech qachon yuklanmaydi.

### 1.4 401 uchun response interceptor yo'q — P1
`src/lib/api.ts` da faqat request interceptor bor. Token muddati tugaganda:
- Har bir so'rov 401 qaytaradi
- `AuthContext` hali ham `customer` ni saqlab turadi → UI "kirgan" ko'rinadi
- Foydalanuvchi login sahifasiga yo'naltirilmaydi, faqat bo'sh sahifalarni ko'radi

**Tuzatish:** response interceptor — 401 da `tokenStore.clear()` + `/login` ga redirect.

### 1.5 Root ErrorBoundary yo'q — P1
Butun ilovada faqat bitta ErrorBoundary bor —`HeroSection.tsx:62` dagi
`GlobeErrorBoundary`. Boshqa har qanday komponentdagi render xatosi **butun
sahifani oq ekranga** aylantiradi. `App.tsx` darajasida boundary kerak.

### 1.6 `/hero-options` production'da ochiq — P2
`src/pages/HeroOptions.tsx` (126 qator) — bu dizayn variantlarini solishtirish
uchun ichki qoralama sahifa, lekin `App.tsx:41` da oddiy route sifatida
ro'yxatdan o'tgan va production build'ga kiradi. Olib tashlash yoki
`import.meta.env.DEV` shartiga o'rash kerak.

---

## 2. TypeScript: `strict` o'chirilgan

`tsconfig.app.json` da **`"strict": true` yo'q**. Bu TS himoyasining eng muhim
qismini — `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` — o'chiradi.

Yaxshi xabar: yoqib ko'rdim, **atigi 4 ta xato** chiqadi (`noUncheckedIndexedAccess`
bilan birga):

```
components/Counter.tsx:28          'entry' is possibly 'undefined'
components/Reveal.tsx:44           'entry' is possibly 'undefined'
components/home/HeroGlobe.tsx:57   'entry' is possibly 'undefined'
components/home/Benefits.tsx:68    LucideIcon | undefined → LucideIcon
```

Uchtasi bir xil naqsh: `IntersectionObserver(([entry]) => ...)` — massiv
destrukturasi. Bittasi o'lik kodda (Benefits). Ya'ni **strict'ni yoqish ~15
daqiqalik ish** va bu eng arzon sifat g'alabasi.

Shuningdek 16 ta `: any` / `as any` va 7 ta `eslint-disable` bor — asosan
`react-globe.gl` atrofida (kutubxonada tiplar yo'q, kechirimli).

---

## 3. Xavfsizlik

### 3.1 5 ta high-severity CVE
```
high  react-router      7.12.0–8.2.0   RSC Mode CSRF Bypass
high  react-router-dom  >=7.12.0-pre.0 (yuqoridagiga bog'liq)
high  postcss           <=8.5.17       Path Traversal (sourceMappingURL)
high  d3-color          <3.1.0         ReDoS
high  d3-interpolate    0.1.3–2.0.1    (d3-color'ga bog'liq)
```
`react-router` tuzatishi breaking (7.11.0 ga tushirish). d3-* — `react-globe.gl`
tranzitiv bog'liqligi, `overrides` bilan majburlash mumkin.

### 3.2 JWT localStorage'da
`src/lib/api.ts:3` — token `localStorage` da. Har qanday XSS tokenni to'liq
o'g'irlaydi. Sanoat standarti: `httpOnly` + `Secure` + `SameSite=Strict` cookie
(backend o'zgarishi talab qiladi). Agar localStorage qolsa, hech bo'lmaganda
qat'iy CSP kerak — hozir CSP umuman yo'q.

### 3.3 Demo parol kod ichida
`src/pages/Login.tsx:22-23`:
```ts
const [email, setEmail] = useState('demo@fastsim.dev')
const [password, setPassword] = useState('demo12345')
```
Production login formasi haqiqiy hisob ma'lumotlari bilan oldindan to'ldirilgan.
Agar bu hisob prod bazasida mavjud bo'lsa — bu ochiq kirish. `import.meta.env.DEV`
ostiga olish yoki butunlay olib tashlash kerak.

### 3.4 `innerHTML` GlobeCore'da
`src/components/account/GlobeCore.tsx:127` — bayroq markerlari `innerHTML` bilan
quriladi. Ma'lumot statik topojson va `flagUrl()` dan keladi, shuning uchun
hozir xavf past. Lekin agar kelajakda `d.properties.name` backend'dan kelsa —
XSS vektori. `textContent` + DOM API ga o'tish yaxshiroq.

### 3.5 Xavfsizlik header'lari yo'q
CSP, `X-Frame-Options`, `Referrer-Policy` — hech biri sozlanmagan. Bu deploy
qatlami (Vercel `vercel.json` / nginx) ishi, lekin repoda hech qanday iz yo'q.

---

## 4. Performance — asosiy muammo

### Build natijasi
```
dist/assets/index.css                  96.85 kB │ gzip:  15.40 kB
dist/assets/index.js                  577.93 kB │ gzip: 186.70 kB   ← boshlang'ich
dist/assets/react-globe.gl.js       1 892.10 kB │ gzip: 533.32 kB   ← desktop hero
dist/assets/HeroGlobe.js                2.13 kB
dist/assets/GlobeCore.js                3.95 kB
```

### 4.1 Route-level code splitting umuman yo'q — P0 (performance)
`App.tsx` barcha 10 sahifani statik import qiladi. Natijada bosh sahifaga kirgan
foydalanuvchi Account, Checkout, Support, HeroOptions kodini ham yuklaydi.

Asosiy chunk tarkibi (source hajmi bo'yicha):
```
533 KB  react-dom
363 KB  react-router
232 KB  gsap          ← faqat fade-in animatsiya uchun
145 KB  axios
 80 KB  i18next
 49 KB  3 ta locale   ← uchalasi birdaniga
 41 KB  lucide-react
```

**Tuzatish:** `lazy()` + `Suspense` har bir route uchun. Faqat shu ~40% initial
JS ni kesadi.

### 4.2 GSAP 232 KB — oddiy fade-in uchun
`Reveal.tsx` GSAP dan faqat `gsap.set` va `gsap.to` (autoAlpha + y) ishlatadi.
Buni CSS `@keyframes` + `IntersectionObserver` bilan **0 KB** ga almashtirish
mumkin. Yoki hech bo'lmaganda `gsap/gsap-core` faqat kerakli modulini import qilish.

### 4.3 Desktop'da hero globe = +533 KB gzip
`HeroSection.tsx` desktop'da (`min-width: 1024px`) darhol `react-globe.gl` ni
lazy yuklaydi — bu 1.9 MB xom / 533 KB gzip. Dekorativ aylanuvchi globus uchun
juda qimmat. LCP va mobil bo'lmagan foydalanuvchilar uchun sezilarli.

Adolat uchun: implementatsiya **juda puxta** — WebGL detect, `prefers-reduced-motion`,
ErrorBoundary, `GlobeFallback`, `pixelRatio` cheklovi, `IntersectionObserver` bilan
pauza, `visibilitychange` bilan pauza, `material.dispose()`. Bu senior darajadagi ish.
Muammo kutubxona tanlovida, kodda emas.

**Muqobil:** statik WebP/AVIF rasm yoki yengil SVG globus + faqat foydalanuvchi
o'zaro ta'sir qilganda haqiqiy globusni yuklash.

### 4.4 Uchala til birdaniga yuklanadi
`src/i18n/index.ts` en/ru/uz ni statik import qiladi (49 KB). `i18next-http-backend`
yoki dinamik `import()` bilan faqat kerakli tilni yuklash mumkin.

### 4.5 CSS 97 KB
Tailwind 4 uchun katta. `src/index.css` da 302 qator qo'lda yozilgan qatlam bor.
Purge to'g'ri ishlayotganini tekshirish kerak.

---

## 5. O'lik kod — 579 qator

Hech qayerdan import qilinmagan fayllar:

| Fayl | Qator |
|---|---|
| `pages/Calculator.tsx` | 326 |
| `components/home/Benefits.tsx` | 91 |
| `components/home/PromoBanner.tsx` | 68 |
| `components/home/AppPromo.tsx` | 38 |
| `components/PaymentMethodBadges.tsx` | 31 |
| `components/home/FinalCta.tsx` | 25 |
| **Jami** | **579** |

Bundan tashqari locale fayllarida ishlatilmagan kalitlar bor (`checkout.payNow`,
`checkout.successTitle`, `account.statusPaid` va h.k.) — bu tugallanmagan
to'lov oqimidan qolgan. `Checkout.tsx:180` da to'lov tugmasi `disabled` —
to'lov integratsiyasi hali yozilmagan.

---

## 6. Infrastruktura — deyarli hech narsa yo'q

| Narsa | Holat |
|---|---|
| Testlar | **0 ta**. Vitest/Jest/Playwright/Cypress — hech biri yo'q |
| CI/CD | **Yo'q**. `.github/` papkasi mavjud emas |
| Docker | **Yo'q**. Dockerfile / compose yo'q |
| Env config | **Yo'q**. API URL `/api` deb hardcode qilingan, `import.meta.env` umuman ishlatilmagan |
| Pre-commit hook | Yo'q (husky/lint-staged yo'q) |
| Prettier | Yo'q |
| README | Hali ham **Vite shabloni** — loyiha haqida bir og'iz ham yo'q |
| Type-aware lint | Yoqilmagan (`oxlint-tsgolint` o'rnatilmagan) |

Env yo'qligi jiddiy: staging/prod uchun boshqa API domenga o'tish uchun kodni
o'zgartirish kerak. `VITE_API_BASE_URL` kerak.

---

## 7. A11y

- `<label>` teglarining 14/17 tasida `htmlFor` yo'q — screen reader input bilan
  yorliqni bog'lay olmaydi. Faqat `ReviewPanel.tsx` to'g'ri qilgan.
- `GlobeCore.tsx:129` `<img>` da `alt` yo'q (innerHTML ichida).
- Ijobiy: logout modal to'g'ri (`role="dialog"`, `aria-modal`, `aria-labelledby`,
  `aria-describedby`), reyting yulduzchalari `role="radiogroup"`/`radio`/`aria-checked`,
  tab'lar `aria-pressed`, `Flag.tsx` da `alt` fallback bor, `prefers-reduced-motion`
  hurmat qilinadi.

Umuman a11y o'rtachadan yuqori, faqat form label'lari yetishmaydi.

---

## 8. Nima yaxshi qilingan

Tanqidni muvozanatlash uchun — bu kod ko'p jihatdan haqiqatan puxta:

- **i18n mukammal**: 314 kalit, uch tilda **100% parite**, bitta ham farq yo'q.
  Bu kamdan-kam uchraydi.
- **Globe muhandisligi** (yuqorida sanab o'tilgan) — resurs boshqaruvi darslik darajasida.
- **`Reveal.tsx`** progressive enhancement bilan yozilgan: `prefers-reduced-motion`,
  `IntersectionObserver` yo'qligiga fallback, bfcache uchun timeout fallback,
  cleanup'da `killTweensOf`. Izohlar **nima uchun** shundayligini tushuntiradi.
- **`CurrencyContext`** — fallback kurs, `useMemo`/`useCallback` to'g'ri, `Intl` API.
- **Context arxitekturasi toza** — Auth/Cart/Currency ajratilgan, har birida
  provider tekshiruvi bilan hook.
- **Xato holatlari** Account va WorldMap'da retry tugmasi bilan ishlangan.
- **Mobil UX** — safe-area inset, snap scroll, bottom sheet modal, `min-[380px]`
  breakpoint'lari. Oxirgi 4 commit shunga bag'ishlangan va sezilarli.
- Build toza (368 ms), `tsc -b` toza, `oxlint` toza, dev server 178 ms.

---

## 9. Prioritetlangan reja

### P0 — darhol (yarim kun)
1. `destinations.mostPopular` tuzatish — bosh sahifadagi ko'rinadigan bug
2. `Login.tsx` dan demo parolni olib tashlash
3. `tsconfig.app.json` ga `"strict": true` + 4 ta xatoni tuzatish
4. Route-level `lazy()` — initial bundle ~40% kamayadi
5. `npm audit fix` + `overrides` bilan d3-* majburlash

### P1 — shu hafta (2-3 kun)
6. Root `ErrorBoundary` (`App.tsx`)
7. `api.ts` ga 401 response interceptor
8. Yetishmayotgan `.catch` lar (4 joy, ayniqsa ReferralPanel)
9. O'lik kodni o'chirish (579 qator) yoki Calculator'ni tугallash
10. `/hero-options` ni prod'dan olib tashlash
11. `VITE_API_BASE_URL` env
12. Form `<label htmlFor>` bog'lanishlari

### P2 — keyingi sprint
13. Vitest + Testing Library, kritik oqimlarga test (auth, cart, checkout quote)
14. GitHub Actions CI: typecheck + lint + build + test
15. GSAP ni CSS animatsiyaga almashtirish (−232 KB)
16. Locale'larni dinamik yuklash (−33 KB)
17. Hero globe uchun yengilroq yechim (−533 KB gzip desktop'da)
18. CSP va xavfsizlik header'lari
19. README yozish
20. Prettier + husky + lint-staged

### P3 — arxitektura
21. Server state uchun TanStack Query — hozir har bir komponent `useEffect` +
    `useState` bilan qo'lda fetch qiladi, cache/dedupe/retry yo'q
22. Zod bilan API javoblarini runtime validatsiya qilish — hozir `as` bilan
    ko'r-ko'rona ishoniladi
23. Sentry yoki shunga o'xshash error tracking
24. httpOnly cookie auth ga o'tish (backend bilan birga)

---

## 10. Umumiy baho

| Jihat | Baho |
|---|---|
| Kod sifati / o'qilishi | 8/10 — toza, izohlar mazmunli |
| TypeScript qat'iyligi | 4/10 — strict o'chirilgan |
| Arxitektura | 6/10 — toza, lekin server-state qatlami yo'q |
| Performance | 4/10 — code splitting yo'q, 720 KB gzip desktop'da |
| Xavfsizlik | 4/10 — 5 CVE, demo parol, CSP yo'q |
| Test qamrovi | 0/10 |
| Infrastruktura | 2/10 — CI, Docker, env yo'q |
| i18n | 10/10 |
| A11y | 6/10 |

**Xulosa:** bu iste'dodli dasturchi tomonidan yozilgan, lekin production
qattiqligi (test, CI, env, xato boshqaruvi) hali qo'shilmagan **kuchli prototip**.
Kodning o'zi senior darajaga yaqin — yetishmayotgani atrofidagi muhandislik
intizomi. P0+P1 ro'yxati (~3-4 kun ish) uni haqiqiy production darajaga olib chiqadi.
