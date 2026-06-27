import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // These deps ship CommonJS — pre-bundle them for the dev server.
  optimizeDeps: {
    include: [
      'prop-types',
      'd3-geo',
      'topojson-client',
      'react-globe.gl',
      'three',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
