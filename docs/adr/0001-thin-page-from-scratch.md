# The Page is a thin wrapper written from scratch; the control layer stays in juicebox-mcp

juicebox-mcp's Join links and Snapshot links used to open the weiszd fork of juicebox-web, a full application with its load menus, catalogs, share modal and session files, much of which an LLM-driven view in a side panel never uses. We replace that fork with this repo. It is a minimal wrapper around juicebox.js written from scratch: a one-row Header with the Room indicator, a line of status and the Join link, and juicebox.js below it, untouched. The Page attaches to a Room with `attachRemote` from `@aidenlab/juicebox-remote` and talks to the juicebox-mcp server unchanged. Writing it from scratch keeps the fork's assumptions out. Keeping the control layer as juicebox-mcp's package means the wire protocol has one owner, which is the same server side that already releases it.

## Considered Options

- **Trim juicebox-web down.** Rejected: what survives is a small fraction of it, and every removal would leave behind coupling to the shell that was removed.
- **Own the Room connection in this repo, as igvjs-mcp's Viewer does.** Rejected: the juicebox-mcp protocol already lives in `@aidenlab/juicebox-remote`, and a second implementation would drift from the server.

## Consequences

The fork is retired once dev and production have cut over. juicebox-mcp's deploy scripts, `BROWSER_URL` and `ALLOWED_ORIGINS` are re-pointed at this repo's Pages projects, `juicebox-view-dev` and `juicebox-view`.
