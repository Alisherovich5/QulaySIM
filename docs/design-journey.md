# QulaySIM — yangi kompozitsiya

## Qaror

O‘zbekistondan sayohat qiluvchi odam uchun: manzilni topish, tushunarli tarif tanlash, eSIMni boshqarish. Saytning o‘ziga xos belgisi — mavjud interaktiv 3D globus. U dekorativ kartalar bilan o‘ralmaydi; manzil tanlash asbobi bo‘lib qoladi.

Yangi yo‘nalish: tungi jo‘nash sahnasi va yorug‘ sayohat katalogi. Oldingi mint fonli hero va bir xil kartalar kompozitsiyasi almashtirildi. Navbar rang va tuzilishi foydalanuvchi namunasidan; keyingi “juda katta” fikriga ko‘ra o‘lchamlari ixchamlashtirildi: desktop 70 px, mobil 64 px. Katta ekranda ham bir xil o‘lchamda.

- Ranglar: Departure `#101713`, Cabin `#18211c`, Signal `#4fa38e`, Paper `#f8faf7`, Ink `#21362c`, Line `#dce4dc`.
- Shrift: mavjud Unbounded 600 — brend va sarlavha; mavjud Inter 400/600 — matn, narx va boshqaruvlar.
- Ritm: 8 / 24 / 64 px; bosh konteyner 1488 px, desktop yon joy 48 px.
- Radius: boshqaruv 14 px, kontent 24 px, yirik sahna 32 px. Navbar 22 px, mobil 20 px.
- O‘ziga xos element: katta globus bilan yonma-yon qisqa savol va alohida bronlashga o‘xshash manzil qidiruvi.

```text
Desktop / bosh sahifa
┌ logo ─ yo‘nalishlar ─ menga yetadimi ─ qanday ishlaydi ─ yordam ─ til / tema / eSIM ┐
│  Sayohat uchun eSIM               Interaktiv 3D globus                            │
│  Qayerga                                                                        │
│  boramiz?                         Aylantiring va davlatni tanlang                │
│  [ Manzilni qidirish                     → ]                                     │
│  Turkiya · Gruziya · ...                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
  O‘z raqamingiz · QR o‘rnatish · So‘mda to‘lash
┌ katta manzil surati ────────────┬ surat ────────┬ surat ───────────────────────────┐
│                                ├───────────────┴ keng surat ──────────────────────┤
└────────────────────────────────┴────────────────────────────────────────────────┘
  eSIM qanday ishlaydi — ketma-ket uch qadam; qurilma va yordam havolalari

Katalog                     Tarif                       Kabinet
Manzil sarlavhasi / foto     Manzil banneri              Profil / bo‘limlar
Turlar │ qidiruv             Tariflar │ tanlov xulosasi   Yon menyu │ ish maydoni
Filtr  │ manzillar           Tafsilotlar / moslik         Haqiqiy holat / eSIMlar
```

Mobil: qidiruv globusdan oldin; navbar menyuga yig‘iladi; tarif xulosasi tanlovlardan keyin; kabinet bo‘limlari gorizontal scroll qiladi. Har bir asosiy sahifa 320 px gacha tekshiriladi.

Manbalar: foydalanuvchining navbar rasmi; [Nomad](https://www.getnomad.app/) va [Roamless](https://roamless.com/) kategoriya bo‘yicha referens. Narx, statistika, qamrov va foydalanuvchi ma’lumoti mavjud API’dan; sun’iy social proof qo‘shilmaydi.

Skill: `frontend-design`, `ui-design` Build, `playwright`. Build asoslari: aesthetic-direction, design-in-code, design-guidelines; colors, typography, custom-fonts, headers, navigation, buttons, border-radius, responsive-design, landing-pages, heading-groups, section-layout, surfaces, dark-mode, images, pricing-cards, form-controls, login-pages, footers, icons, dashboards, shadows.
