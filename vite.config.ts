import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { prerender } from './scripts/prerender'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Port 8000 is the convention, but it is often taken by another project on
  // the same machine. Override either of these in .env.local rather than
  // editing this file.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const port = Number(env.VITE_PORT) || 5173

  return {
    // prerender runs only on `vite build`, after dist/ is written.
    plugins: [
      react(),
      tailwindcss(),
      prerender(),
      // A bundle map, on request only: `ANALYZE=1 npm run build` writes
      // dist/stats.html. Every diet decision after this is made from the map
      // rather than from a guess about which import is heavy.
      ...(process.env.ANALYZE
        ? [visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
        : []),
    ],
    build: {
      modulePreload: {
        // The hero globe is lazy() *and* gated to desktops with WebGL — yet
        // every visitor downloaded it, because Vite emits a modulepreload link
        // for the chunk and the browser fetches that regardless of whether the
        // component ever renders. On a 390px phone that was 1.85 MB of code for
        // an element the page never shows.
        //
        // Preloading stays on for everything else; only the globe and the
        // things only it needs are dropped, so they download when the desktop
        // hero actually asks for them.
        resolveDependencies: (_url, deps) =>
          deps.filter(
            (dep) =>
              !/(react-globe\.gl|HeroGlobe|three|topojson|d3-geo|feature-)/.test(dep),
          ),
      },
    },
    // These deps ship CommonJS — pre-bundle them for the dev server.
    optimizeDeps: {
      include: ['prop-types', 'd3-geo', 'topojson-client', 'react-globe.gl', 'three'],
    },
    server: {
      port,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
