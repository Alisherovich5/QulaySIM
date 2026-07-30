/**
 * Applies the saved theme before first paint.
 *
 * This lived inline in index.html, where the site's own Content-Security-Policy
 * (script-src 'self') blocked it — so it never ran and every load flashed the
 * light theme at dark-mode users. An external file from the same origin is
 * allowed by that policy without loosening it, and a blocking script in <head>
 * still runs before paint, which is the whole point of it.
 */
(function () {
  try {
    var t = localStorage.getItem('fastsim_theme')
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    if (t === 'dark') document.documentElement.classList.add('dark')
  } catch (e) {
    /* Private mode can throw on localStorage; the light default is fine. */
  }
})()
