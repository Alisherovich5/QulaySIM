/**
 * Tell Yandex and Bing about our URLs, without waiting to be crawled.
 *
 * IndexNow is the push half of what a sitemap does by pull: one POST and the
 * participating engines (Yandex and Bing — Google does not take part) put the
 * URLs straight into their crawl queue. For this site Yandex is the one that
 * matters: the Russian-speaking half of the Tashkent audience searches there.
 *
 * Run after a deploy that changes pages:  node scripts/indexnow.mjs
 * The URL list is read from the live sitemap, so it is always the set of pages
 * production is actually serving — never a stale local list.
 *
 * The key proves we control the host: the engines fetch /<key>.txt from the
 * site and check it matches. The file lives in public/, so it ships with every
 * build. It is not a secret — the whole scheme is that it is publicly visible.
 */
const KEY = 'a1939f74af3ddd9484c419fd4aba2e11'
const HOST = 'qulaysim.uz'

const res = await fetch(`https://${HOST}/sitemap.xml`)
if (!res.ok) throw new Error(`sitemap: ${res.status}`)
const xml = await res.text()
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (urls.length === 0) throw new Error('sitemap had no URLs')

// One batch call; the protocol caps a submission at 10 000 URLs, far above us.
const ping = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
})
// 200 = accepted, 202 = accepted-pending-key-check; both are success.
console.log(`indexnow: ${ping.status} ${ping.statusText} — ${urls.length} URL yuborildi`)
if (ping.status >= 400) process.exit(1)
