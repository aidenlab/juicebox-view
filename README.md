# juicebox-view

The Page juicebox-mcp's links open: a thin web page that houses [juicebox.js](https://github.com/aidenlab/juicebox.js) under a one-row Header, so a model can drive Hi-C contact maps beside a conversation while a person works on them by hand. See `GLOSSARY.md` for the vocabulary and `docs/adr/` for the decisions behind it.

- Opened with no query, the Page shows the Header (not in a Room) and one empty Panel.
- Opened with a Snapshot link (`?session=…`), it shows the view the link encodes; juicebox.js restores it.
- Opened with a Join link (`?room=…`), it joins that juicebox-mcp Room through [`@aidenlab/juicebox-remote`](https://www.npmjs.com/package/@aidenlab/juicebox-remote), so the model's tools drive the Panel. The Header's Room indicator is amber while connecting or reconnecting, green once joined, red when the Room has expired.
- The Header's button hides and shows the Juicebox Panel Controls. In a Room the model can do the same with `show_panel_controls`, and every Page in the Room follows, including one that joins later.

The Panel is juicebox.js as it ships. The Page adds nothing to it.

## Development

Requires Node.js.

```sh
npm install
npm run dev      # the Page at http://localhost:5173 (the port is fixed)
npm test         # Vitest
npm run test:roundtrip  # the end-to-end round trip (see below)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

The Room relay's WebSocket address is `VITE_WS_URL`, baked in at build time. In dev it is `ws://localhost:5173/ws` (`.env.development`), and the Vite server forwards `/ws` to a juicebox-mcp Worker running locally on port 8787.

In `npm run dev`, contact maps on ENCODE and the other hosts that refuse a browser load through juicebox.js's dev proxy. A production build does not include it.

## The round trip

`npm run test:roundtrip` is the end-to-end test: it builds the Page as it is deployed, serves it at `localhost:4183`, starts a juicebox-mcp Worker under `wrangler dev` at `localhost:8797`, and stops both when it is done. In a headless Chromium it opens the Join link the model gets from `get_juicebox_url`, waits for the Room indicator to turn green, checks the Join link and Copy, then runs `load_map` and `goto_locus` through the Worker's `/mcp` and checks that both are acked, that the Room indicator pulses and that the Panel shows the new locus. Then it hides and shows the Juicebox Panel Controls with `show_panel_controls` and the Header button, and checks that a second and third Page in the Room follow. Its ports are not the development ones, so it runs beside `npm run dev` and a local Worker on 8787.

It is slow and not hermetic: juicebox.js reads its contact map from ENCODE.

One-time setup:

```sh
npx playwright install chromium   # Playwright's headless Chromium
git clone https://github.com/weiszd/juicebox-mcp.git ../juicebox-mcp
(cd ../juicebox-mcp && npm install)
```

The Worker runs from the juicebox-mcp checkout at `../juicebox-mcp`, beside this repo. For a checkout elsewhere, name it:

```sh
JUICEBOX_MCP=/path/to/juicebox-mcp npm run test:roundtrip
```

The test passes the Worker its `BROWSER_URL` and `ALLOWED_ORIGINS` and keeps its state in a temporary directory, so the checkout needs no `.dev.vars` and is left as it was.
