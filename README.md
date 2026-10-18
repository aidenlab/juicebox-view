# juicebox-view

The Page juicebox-mcp's links open: a thin web page that houses [juicebox.js](https://github.com/aidenlab/juicebox.js) under a one-row Header, so a model can drive Hi-C contact maps beside a conversation while a person works on them by hand. See `GLOSSARY.md` for the vocabulary and `docs/adr/` for the decisions behind it.

- Opened with no query, the Page shows the Header (not in a Room) and one empty Panel.
- Opened with a Snapshot link (`?session=…`), it shows the view the link encodes; juicebox.js restores it.
- Opened with a Join link (`?room=…`), it joins that juicebox-mcp Room through [`@aidenlab/juicebox-remote`](https://www.npmjs.com/package/@aidenlab/juicebox-remote), so the model's tools drive the Panel. The Header's Room indicator is amber while connecting or reconnecting, green once joined, red when the Room has expired.

The Panel is juicebox.js as it ships. The Page adds nothing to it.

## Development

Requires Node.js.

```sh
npm install
npm run dev      # the Page at http://localhost:5173 (the port is fixed)
npm test         # Vitest
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

The Room relay's WebSocket address is `VITE_WS_URL`, baked in at build time. In dev it is `ws://localhost:5173/ws` (`.env.development`), and the Vite server forwards `/ws` to a juicebox-mcp Worker running locally on port 8787.

In `npm run dev`, contact maps on ENCODE and the other hosts that refuse a browser load through juicebox.js's dev proxy. A production build does not include it.
