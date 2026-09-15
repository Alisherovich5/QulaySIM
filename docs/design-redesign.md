# QulaySIM — to‘liq interfeys yangilanishi

> Avvalgi iteratsiya arxivi. Amaldagi yangi dizayn va ixcham navbar: [design-journey.md](./design-journey.md). Quyidagi eski rang va o‘lchamlar joriy interfeysga tegishli emas.

2026-09-06. Asosiy React/Vite loyihasiga qo‘llandi; production saytga chiqarilmadi.

## Ko‘rish

- Ishlaydigan loyiha: http://127.0.0.1:5187
- Barcha ekranlar: http://127.0.0.1:5187/output/design-gallery.html
- To‘liq o‘lchamli PNG fayllar: `output/playwright/`.

Qayta ishga tushirish:

```sh
VITE_API_PROXY_TARGET=https://qulaysim.uz npm run dev -- --host 127.0.0.1 --port 5187
```

Bu konfiguratsiya ochiq katalogni mavjud API’dan oladi. Oddiy saytdagi haqiqiy checkout va auth funksiyalari saqlangan. Galereyadagi xususiy kabinet va to‘lov tasvirlari esa brauzer fixture’lari bilan olingan; haqiqiy hisobga kirilmagan va buyurtma yaratilmagan.

## Vizual yo‘nalish

Yengil, sayohatga xos va tinch interfeys: aniq yo‘nalish qidiruvi, tez taqqoslanadigan tariflar, asosiy amalni ajratib ko‘rsatadigan yashil rang.

| Asos                  | Qiymat                                            |
| --------------------- | ------------------------------------------------- |
| Navbar                | `#181f1c`, kontur `#303833`, aksent `#4caa97`     |
| Footer                | `#153e35`, `#10342c`                              |
| Asosiy amal           | `#007365`                                         |
| Hero va yordamchi fon | `#eaf3ec`                                         |
| Sahifa                | `#fcfdfb`                                         |
| Matn                  | `#183c34`, `#62706a`                              |
| Sarlavha              | Mahalliy Manrope 600                              |
| Asosiy matn           | Mavjud mahalliy Inter 400/600                     |
| Layout                | 1248 px konteyner; 32/28/20/16 px yon bo‘shliqlar |
| Mobil                 | 320, 360, 390 px; planshet 768/1024 px            |

Kartalar va formalar 12–20 px radiusda; dekorativ soyalar kamaytirildi. Desktopda globus matndan alohida kompozitsiyada, mobilda matndan keyin turadi. Mavjud `HeroGlobe.tsx` va 3D yadro o‘zgartirilmadi. WebGL bo‘lmaganda va kamaytirilgan harakat rejimida mavjud fallback saqlanadi.

## Qamrov

Bosh sahifa; davlatlar va hududlar katalogi; davlat tariflari; hududiy tariflar; global tariflar va qamrov; qurilma mosligi; yordam markazi; kirish; ro‘yxatdan o‘tish; savat va to‘lov qobig‘i; kabinetdagi xarita, eSIM, buyurtmalar, sozlamalar, taklif va fikr bo‘limlari; eSIM haqida; o‘rnatish qo‘llanmasi; oferta, maxfiylik, qaytarish; 404.

Navbarda til, valyuta, ko‘rinish va savat saqlandi. Mobilda ochiluvchi menyu va pastki navigatsiya bor. Eski `/yangi` eksperimental prototipi taqqoslash uchun o‘z manzilida qoldirildi; u asosiy navigatsiyaning bir qismi emas.

Tarif tanlashda radio kartalar, muddat filtri va yagona buyurtma tugmasi qo‘llandi. eSIM kartasida QR, qolgan internet va amal qilish muddati ajratildi. Qidiruvning bo‘sh holati, yuklanishlar, formadagi xatolar, kabinet bo‘sh holati va qayta urinishlar saqlandi/yaxshilandi. Dialoglarda Escape, fokusni saqlash/qaytarish va fon scrollini bloklash qo‘shildi. Fikr bahosi native radio orqali klaviaturada ishlaydi. Kabinet raqamlari animatsiyali oraliq qiymatlar emas, haqiqiy qiymatni darhol ko‘rsatadi.

## Manbalar va media

UX yo‘nalishlari ko‘rildi: [Airalo](https://www.airalo.com/), [Saily](https://saily.com/), [Holafly](https://esim.holafly.com/). Yo‘nalish qidiruvi, lokal/hududiy/global ajratish va o‘rnatish yo‘riqnomalarining tushunarliligi asos sifatida olindi. Ularning kodi, logosi yoki sahifa dizayni nusxalanmadi.

Destination rasmlari lokal `public/media/` ichida:

- Istanbul: [Unsplash rasmi](https://images.unsplash.com/photo-1524231757912-21f4fe3a7200) → `istanbul.jpg`.
- Dubay: [Unsplash rasmi](https://images.unsplash.com/photo-1512453979798-5ea266f8880c) → `dubai.jpg`.
- Tailand: [Unsplash rasmi](https://images.unsplash.com/photo-1528181304800-259b08848526) → `thailand.jpg`.
- Bali: [Alana Harris / Unsplash](https://unsplash.com/photos/green-rice-field-in-a-hill-during-daytime-a10GIv3UBq4) → `bali.jpg`.
- Manrope 600: Google Fonts’dan lokal `public/fonts/manrope-semibold.ttf`.

Globus, bayroqlar, logo va mavjud o‘rnatish media fayllari saqlandi. Sun’iy mijoz sharhlari yoki qo‘shimcha savdo statistikasi qo‘shilmadi. Galereya QR-kodi alohida `output/design-qr.svg`: u “DESIGN PREVIEW ONLY — NOT AN ESIM” matnini kodlaydi va ishlaydigan eSIM emas.

## Tekshiruvlar

- `npm run verify`: TypeScript, oxlint, qatlamlar auditi, 624 ta i18n kalitining til pariteti va **84/84 unit test** o‘tdi.
- `npm run build`: muvaffaqiyatli, uch tilda 126 ta prerender sahifa.
- `npm run e2e`: **22/22 brauzer testi**, phone va desktop; davlatdan savatga o‘tish, til prefiksi, global qamrov filtri, hududlar, qurilma mosligi, katalog offline fallback’i hamda yangilangan navbar oqimlari.
- Desktop 1440 va mobil 390 px sahifalar; bosh sahifa qo‘shimcha 320/360/768/1024 px; rus/ingliz sahifalari va qorong‘i rejim ko‘rildi.
- Kabinet hamda checkout namunaviy ma’lumotlar bilan tekshirildi. UI tekshiruvlarida haqiqiy to‘lov yoki profil o‘zgarishi bajarilmadi.
- Galereyadagi **58 ta PNG** manzili tekshirildi: yo‘qolgan fayl yo‘q. Tekshirilgan sahifalarda gorizontal chiqish va yuklanmagan rasm aniqlanmadi.
- Mobil menyu Escape bilan yopilishi, qidiruvni tozalash, muddat filtri, tanlangan tarifning savatga tushishi, qamrov/top-up oynalarida fokus, klaviaturada baho tanlash va to‘lovdan qaytishda fokus tekshirildi. Chiqishni tasdiqlash oynasi xavfsiz “Bekor qilish” tugmasiga fokus beradi.

Mahalliy Google OAuth production origin cheklovi sabab localhost’da 403 qaytarishi mumkin. OAuth konfiguratsiyasi o‘zgartirilmadi. To‘lov provayderining real ichki formasini bu ish tasdiqlamaydi: uning qobig‘i va ochilish/yopilish oqimi fixture bilan tekshirildi. Build katta 3D chunk haqida ogohlantiradi; globus lazy-load holatda saqlandi.

Ekranlarni qayta olish uchun Playwright CLI skill wrapper mavjud bo‘lishi kerak:

```sh
node scripts/capture-design.mjs
# Faqat kabinet, savat, tillar va theme holatlari:
DESIGN_PHASE=private node scripts/capture-design.mjs
```

## Qo‘llangan skill va yo‘riqnomalar

`frontend-design` + `ui-design` **Build** rejimi vizual tizim, shrift, bo‘shliqlar, CTA va responsive kompozitsiyani belgiladi. `playwright` real brauzer tekshiruvlari va PNG ekranlar uchun ishlatildi. Figma yoki Canva fayli yaratilmagan: natija to‘g‘ridan-to‘g‘ri ishlaydigan loyiha.

O‘qilgan yo‘riqnomalar: `frontend-design/SKILL.md`; `ui-design/SKILL.md`; `direction/aesthetic-direction.md`; `direction/design-in-code.md`; `design-guidelines.md`; `guidelines/colors.md`, `typography.md`, `headers.md`, `navigation.md`, `responsive-design.md`, `buttons.md`, `form-controls.md`, `custom-fonts.md`, `heading-groups.md`, `landing-pages.md`, `section-layout.md`, `surfaces.md`, `images.md`, `border-radius.md`, `icons.md`, `footers.md`, `pricing-cards.md`; `playwright/SKILL.md` va `references/cli.md`. Alohida Audit rejimi yoki uning rule fayllari qo‘llanmagan.

## Navbar — yuborilgan rasm asosidagi ikkinchi variant

Oldingi keng yashil navbar o‘rniga chetlardan ajralgan to‘q panel qo‘yildi. Wi-Fi nishoni, mavjud Unbounded shriftidagi QulaySIM yozuvi, sokin matnli havolalar, globusli til tanlovi, tema va konturli “Mening eSIM’im” tugmasi rasmga moslashtirildi. Panel ikkala temada ham to‘q qoladi. Bu iteratsiya navbar va uning oqimlariga tegishli; sahifalarning asosiy kompozitsiyalari qayta almashtirilmadi.

- Desktop: 28–40 px radius, chetlarda 28–56 px joy; 1200 px dan kichik ekranda ochiluvchi menyu.
- Mobil: chetlarda 12 px joy, 24 px radius, 48 px bosish maydonlari; tema va eSIM tugmasi menyuda.
- Valyuta til menyusiga joylandi; savatda mahsulot bo‘lsa alohida belgi chiqadi. Bo‘sh savatga mobil menyudan kirish mumkin.
- Chegirma satri navbar tepasidan bosh sahifadagi hero ostiga ko‘chirildi.
- “Mening eSIM’im” hisobga kirishdan keyin ham `?tab=esims` manzilini saqlaydi.
- Til va mobil menyular Escape bilan mustaqil yopiladi; fokus tegishli tugmaga qaytadi. Saqlangan boshqa tildan prefikssiz sahifada o‘zbekchaga qaytish tuzatildi.
- 320–2048 px o‘lchamlar, uchala til, bo‘sh/to‘la savat tekshirildi. To‘la savatdagi 768 px siqilish va 320 px til menyusining chiqib ketishi tuzatilib, regression testlar bilan qoplandi.
- `verify` (84 test), production build va `e2e` (22 test) qayta muvaffaqiyatli o‘tdi. 3D globus kodi o‘zgartirilmadi.

Qo‘shimcha rasmlar: `navbar-reference-dark.png`, `navbar-new-desktop.png`, `navbar-390-light.png`, `navbar-language-mobile.png`, `navbar-cart-320.png`, `navbar-cart-tablet.png` — `output/playwright/` ichida.

Bu tahrirda `frontend-design`, `ui-design` Build va `playwright` qo‘llandi; qo‘shimcha `guidelines/dark-mode.md` va `guidelines/shadows.md` o‘qildi. Rang va maket bo‘yicha asos — foydalanuvchining yuborgan navbar rasmi.
