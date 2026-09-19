/**
 * Applies the saved theme before first paint, and starts the hero image.
 *
 * This lived inline in index.html, where the site's own Content-Security-Policy
 * (script-src 'self') blocked it — so it never ran and every load flashed the
 * light theme at dark-mode users. An external file from the same origin is
 * allowed by that policy without loosening it, and a blocking script in <head>
 * still runs before paint, which is the whole point of it.
 */
(function () {
  /* Says "a browser is running this", before anything paints.
   *
   * Every prerendered page carries a <div id="baked"> inside #root: the page's
   * text, flat, for the crawlers that do not run JavaScript. React replaces it
   * when it mounts — but on a slow connection that is several seconds later,
   * and until then the visitor is looking at six thousand pixels of raw prices
   * and country names. Measured on a throttled connection: visible from 1.5s
   * to 5s.
   *
   * So the CSS hides it behind this class, which only a browser ever gets. A
   * crawler that does not run scripts never adds it and reads the text as
   * before; a crawler that does run them renders the real page anyway. Not a
   * plain `#baked { display: none }`, because text hidden from everybody while
   * being served to search engines is the definition of cloaking.
   *
   * Fails in the safe direction: if this file does not load, the class is
   * never added and the baked text shows, which is what happens today. */
  document.documentElement.classList.add('js')

  var dark = false
  try {
    var t = localStorage.getItem('fastsim_theme')
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    dark = t === 'dark'
    if (dark) document.documentElement.classList.add('dark')
  } catch {
    /* Private mode can throw on localStorage; the light default is fine. */
  }

  /* Start the largest contentful paint here, not in React.
   *
   * The home page's hero is a photograph, and this is a single-page app: the
   * <img> that shows it does not exist in the HTML, so the browser's preload
   * scanner — the thing that normally finds images while the parser is still
   * working — has nothing to find. The fetch would otherwise not begin until
   * the whole bundle had downloaded, parsed and rendered, which on a Tashkent
   * mobile connection is well over a second of a blank hero.
   *
   * Emitted from here rather than from index.html because only this script
   * knows which of the two artworks the visitor is about to see, and preloading
   * both would double the cost of fixing the problem. The srcset and sizes are
   * the same ones HeroArt renders; a mismatch would make the browser fetch a
   * second file rather than reuse this one, so they are kept identical on
   * purpose — see src/lib/media.generated.ts, which both sides read from.
   */
  try {
    if (location.pathname === '/' || location.pathname === '/index.html') {
      var name = dark ? 'hero-dark' : 'hero-light'
      var link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.type = 'image/avif'
      link.imageSrcset =
        '/media/' + name + '-1024.avif 1024w, /media/' + name + '-1774.avif 1774w'
      link.imageSizes = '100vw'
      link.fetchPriority = 'high'
      document.head.appendChild(link)
    }
  } catch {
    /* A browser without imageSrcset simply loads it with the rest. */
  }
})()
