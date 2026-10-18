/**
 * The model's side of the round trip: tools called on the local Worker's /mcp, and the Page
 * the model's Join link opens, in a headless browser.
 */
import { chromium } from 'playwright'
import { PAGE_URL, WORKER_URL } from './addresses.js'

/**
 * @typedef {object} ToolReply A tool reply as it comes.
 * @property {string} text its first text content
 * @property {boolean} isError
 * @property {{ room?: string, joinUrl?: string }|undefined} structuredContent
 */

let rpcId = 0

/**
 * @param {string} method
 * @param {object} params
 * @param {string} [mcpSession] the MCP session id, which the Worker also uses as the Room's id
 * @returns {Promise<{ headers: Headers, body: any }>}
 */
async function rpc(method, params, mcpSession) {
  const response = await fetch(`${WORKER_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(mcpSession ? { 'mcp-session-id': mcpSession } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  })
  return { headers: response.headers, body: await response.json() }
}

/**
 * Starts an MCP session as an MCP client would and gives its id.
 *
 * @returns {Promise<string>}
 */
export async function newMcpSession() {
  const initialized = await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'juicebox-view-roundtrip', version: '0' },
  })
  return initialized.headers.get('mcp-session-id')
}

/**
 * Calls a tool in an MCP session, as the model would.
 *
 * @param {string} mcpSession
 * @param {string} name
 * @param {object} [args]
 * @returns {Promise<ToolReply>}
 */
export async function callTool(mcpSession, name, args = {}) {
  const { result } = (await rpc('tools/call', { name, arguments: args }, mcpSession)).body
  return { text: result.content[0].text, isError: result.isError === true, structuredContent: result.structuredContent }
}

/**
 * Opens a Join link in a headless browser that lets the Page use the clipboard.
 *
 * @param {string} joinLink
 * @returns {Promise<{ browser: import('playwright').Browser, page: import('playwright').Page }>}
 */
export async function openPage(joinLink) {
  const browser = await chromium.launch()
  // ENCODE answers 403 to a browser that says it is headless, so this one does not say so.
  const userAgent = (await browser.newPage().then((blank) => blank.evaluate(() => navigator.userAgent))).replace('HeadlessChrome', 'Chrome')
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: PAGE_URL })
  const page = await context.newPage()
  await page.goto(joinLink)
  return { browser, page }
}
