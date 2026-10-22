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

    // juicebox.js's locus box shows both axes; the contact map is square, so they are the same.
    const locus = page.locator('.hic-chromosome-goto-container input')
    await expect.poll(() => locus.inputValue()).toBe('chr8:127,000,001-129,000,000 chr8:127,000,001-129,000,000')
  })

  it("the Panel's contact map is juicebox.js's default 640 x 640", async () => {
    const map = await page.evaluate(() => document.querySelector('.hic-root [id$="-viewport"]').getBoundingClientRect().toJSON())
    expect(map.width).toBe(640)
    expect(map.height).toBe(640)
  })

  it('the Panels scroll to the bottom of a Panel taller than the window', async () => {
    const { panel, window } = await page.evaluate(() => {
      const panels = document.querySelector('.page__panels')
      panels.scrollTop = panels.scrollHeight
      return { panel: document.querySelector('.hic-root').getBoundingClientRect().toJSON(), window: innerHeight }
    })
    expect(panel.bottom).toBeLessThanOrEqual(window)
  })
})

describe('the Juicebox Panel Controls across the Room', () => {
  /** A second Page in the Room, opened by these tests, and its browser. */
  let secondBrowser
  let second

  /** @param {import('playwright').Page} onPage */
  const panelControlsButton = (onPage) => onPage.locator('.header__panel-controls')

  /**
   * Expects a Page to show or hide its Juicebox Panel Controls, and its Header button to say so.
   *
   * @param {import('playwright').Page} onPage
   * @param {boolean} shown
   */
  async function expectPanelControls(onPage, shown) {
    await expect.poll(() => panelControlsButton(onPage).textContent()).toBe(shown ? 'Hide controls' : 'Show controls')
    expect(await onPage.locator('.hic-navbar-container').first().isVisible()).toBe(shown)
  }

  afterAll(() => secondBrowser?.close())

  it('the model hides them, and the Header button then reads "Show controls"', async () => {
    // The Page starts with them hidden; the model shows them first, so hiding them changes something.
    expectAcked(await callTool(mcpSession, 'show_panel_controls', { show: true }))
    await expectPanelControls(page, true)

    expectAcked(await callTool(mcpSession, 'show_panel_controls', { show: false }))
    await expectPanelControls(page, false)
  })

  it('a Page that joins the Room while they are hidden opens with them hidden', async () => {
    ;({ browser: secondBrowser, page: second } = await openPage(joinLink))
    await second.locator('.room-indicator--joined').waitFor()
    // A Page opens with them hidden anyway; it has the Room's state once it shows the Room's map.
    await expect.poll(() => second.locator('.hic-chromosome-goto-container input').inputValue(), { timeout: 30_000 }).toContain('chr8:127,000,001-129,000,000')
    // juicebox.js selects a restored Panel only once its map has loaded; until then it has no
    // current Panel, and its setNavbarVisible does nothing, so the Header button would too.
    await second.locator('.hic-root-selected').waitFor({ timeout: 30_000 })

    await expectPanelControls(second, false)
  })

  it("the Header button on one Page shows and hides them on the Room's other Page", async () => {
    await panelControlsButton(second).click()
    await expectPanelControls(page, true)

    await panelControlsButton(page).click()
    await expectPanelControls(second, false)
  })

  // Every Page opens with them hidden, so only joining a Room that shows them proves the Room's state reaches it.
  it('a Page that joins the Room while they are shown opens with them shown', async () => {
    expectAcked(await callTool(mcpSession, 'show_panel_controls', { show: true }))
    await expectPanelControls(page, true)

    const { browser: thirdBrowser, page: third } = await openPage(joinLink)
    try {
      await third.locator('.room-indicator--joined').waitFor()
      await expectPanelControls(third, true)
    } finally {
      await thirdBrowser.close()
    }
  })
})
