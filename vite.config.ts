import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Port 8000 is the convention, but it is often taken by another project on
  // the same machine. Override either of these in .env.local rather than
  // editing this file.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const port = Number(env.VITE_PORT) || 5173

  return {
    plugins: [react(), tailwindcss()],
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
