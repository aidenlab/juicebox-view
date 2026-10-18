import { defineConfig } from 'vite'

// The port is fixed: in dev the Page is always at localhost:5173.
// The dev proxy is imported only when serving, so a production build never resolves it.
// /ws is forwarded to a local juicebox-mcp Worker, so the Page reaches the Room relay through
// its own address: Claude desktop's side panel cannot open a socket to another local port.
export default defineConfig(async ({ command }) => ({
  plugins: command === 'serve' ? [(await import('juicebox.js/dev-proxy/plugin')).devProxy()] : [],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      '/ws': { target: 'ws://localhost:8787', ws: true },
    },
  },
}))
