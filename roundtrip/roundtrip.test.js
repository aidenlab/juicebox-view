/**
 * The round trip: the built Page runs juicebox.js in a headless browser and joins a Room on
 * the local Worker through the model's Join link; the test calls tools on /mcp as the model
 * would and checks the Page's Header and Panel.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { callTool, newMcpSession, openPage } from './model.js'
import { PAGE_URL } from './addresses.js'

/** A contact map on ENCODE, which lets any page read it. */
const MAP_URL = 'https://www.encodeproject.org/files/ENCFF555ISR/@@download/ENCFF555ISR.hic'

/** The tool reply's mark of a command no Page acknowledged. */
const UNCONFIRMED = 'sent, unconfirmed'

/**
 * Expects a tool reply that a Page acknowledged without error.
 *
 * @param {import('./model.js').ToolReply} reply
 */
function expectAcked(reply) {
  expect(reply.isError, reply.text).toBe(false)
  expect(reply.text).not.toContain(UNCONFIRMED)
}

let mcpSession
let room
let joinLink
let browser
let page

beforeAll(async () => {
  mcpSession = await newMcpSession()
  const reply = await callTool(mcpSession, 'get_juicebox_url')
  ;({ room, joinUrl: joinLink } = reply.structuredContent)
  ;({ browser, page } = await openPage(joinLink))
})

afterAll(() => browser?.close())

describe('round trip', () => {
  it("the model's Join link opens this Page", () => {
    expect(joinLink).toBe(`${PAGE_URL}/?room=${room}`)
  })

  it('the Page joins the Room: the Room indicator turns green and the status names the Room', async () => {
    await page.locator('.room-indicator--joined').waitFor()
    expect(await page.locator('.header__status').textContent()).toBe(`Joined room ${room}`)
  })

  it('the Header shows the Join link, and Copy puts it on the clipboard', async () => {
    const link = page.locator('.header__join-link')
    await link.waitFor()
    expect(await link.inputValue()).toBe(joinLink)

    await page.locator('.header__copy').click()
    await page.locator('.header__copy', { hasText: 'Copied' }).waitFor()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(joinLink)
  })

  it('a tool the model runs moves the Panel, is acked, and pulses the Room indicator', async () => {
    const loaded = await callTool(mcpSession, 'load_map', { url: MAP_URL, name: 'ENCFF555ISR' })
    expectAcked(loaded)

    // load_map's pulse ends first. The next lasts one cycle, so the wait starts before the call.
    await page.locator('.room-indicator--pulsing').waitFor({ state: 'detached' })
    const pulsed = page.locator('.room-indicator--pulsing').waitFor()
    const moved = await callTool(mcpSession, 'goto_locus', { locus: 'chr8:127,000,001-129,000,000' })
    expectAcked(moved)
    await pulsed

    const indicator = page.locator('.room-indicator')
    expect(await indicator.getAttribute('aria-label')).toBe('Last tool: goto_locus')

    // juicebox.js's locus box shows both axes; the x axis runs on to fill the Panel's width.
    const locus = page.locator('.hic-chromosome-goto-container input')
    await expect.poll(() => locus.inputValue()).toMatch(/^chr8:127,000,001-[\d,]+ chr8:127,000,001-129,000,000$/)
  })
})
