/**
 * The bar that appears when a plan is added.
 *
 * Its own module rather than four keys appended to uz/ru/en.ts: those three
 * files are large and more than one change edits them at a time. Merged into
 * the same namespace at startup — see i18n/index.ts.
 */
export const CART_BAR_COPY = {
  uz: {
    'cartbar.added': "Savatga qo‘shildi",
    'cartbar.go': "Savatga o‘tish",
    'cartbar.more': "Yana tanlash",
    'cartbar.count': "{{count}} ta tarif",
  },
  ru: {
    'cartbar.added': 'Добавлено в корзину',
    'cartbar.go': 'Перейти в корзину',
    'cartbar.more': 'Выбрать ещё',
    'cartbar.count': 'тарифов: {{count}}',
  },
  en: {
    'cartbar.added': 'Added to the cart',
    'cartbar.go': 'Go to the cart',
    'cartbar.more': 'Keep choosing',
    'cartbar.count': '{{count}} plans',
  },
} as const
