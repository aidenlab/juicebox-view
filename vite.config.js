import { defineConfig } from 'vite'

// The port is fixed: in dev the Page is always at localhost:5173.
// The dev proxy is imported only when serving, so a production build never resolves it.
export default defineConfig(async ({ command }) => ({
  plugins: command === 'serve' ? [(await import('juicebox.js/dev-proxy/plugin')).devProxy()] : [],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
}))
