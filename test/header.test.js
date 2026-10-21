import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHeader, followPanelControls, showRoom, showToolCall } from '../src/header.js'

const LINK = 'http://localhost:5173/?room=k3x9q2'

/** Ends one cycle of the Room indicator's pulse, as the browser does. @param {HTMLElement} indicator */
function endPulseCycle(indicator) {
  indicator.dispatchEvent(new Event('animationiteration'))
}

/**
 * A stand-in for juicebox.js's registry-level navbar API: the setter, the getter and the
 * change event it posts on its global EventBus.
 *
 * @param {boolean} visible whether the Juicebox Panel Controls start shown
 */
function fakeJuicebox(visible = true) {
  const subscribers = []
  const globalBus = {
    subscribe: (type, handler) => { if (type === 'NavbarVisibilityChange') subscribers.push(handler) },
  }
  return {
    EventBus: { globalBus },
    isNavbarVisible: () => visible,
    setNavbarVisible(value) {
      if (value === visible) return
      visible = value
      for (const handler of subscribers) handler({ type: 'NavbarVisibilityChange', data: { visible } })
    },
  }
}

/** @param {HTMLElement} header */
function panelControlsButton(header) {
  return header.querySelector('.header__panel-controls')
}

/** @param {HTMLElement} header */
function copyButton(header) {
  return [...header.querySelectorAll('button')].find((button) => button.textContent === 'Copy')
}

describe('Header', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('with no Room, shows a grey Room indicator and asks the person to have Claude open Juicebox', () => {
    const header = createHeader()

    const indicator = header.querySelector('.room-indicator')
    expect(indicator).not.toBeNull()
    expect(indicator.classList.contains('room-indicator--joined')).toBe(false)

    expect(header.querySelector('[role="status"]').textContent).toBe('Not in a room. Ask Claude to open Juicebox.')
  })

  it('shows the Room as it changes, its Room indicator changing colour with it', () => {
    const header = createHeader()
    const indicator = header.querySelector('.room-indicator')

    showRoom(header, { indicator: 'connecting', text: 'Connecting…' })
    expect(indicator.classList.contains('room-indicator--connecting')).toBe(true)
    expect(header.querySelector('[role="status"]').textContent).toBe('Connecting…')

    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2' })
    expect(indicator.classList.contains('room-indicator--joined')).toBe(true)
    expect(indicator.classList.contains('room-indicator--connecting')).toBe(false)
    expect(header.querySelector('[role="status"]').textContent).toBe('Joined room k3x9q2')
  })

  it('once joined, shows the Join link read-only beside a Copy button, and hides them with no link', () => {
    const header = createHeader()
    const field = header.querySelector('[aria-label="Join link"]')
    const copy = copyButton(header)
    expect(field.closest('[hidden]')).not.toBeNull()

    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: LINK })
    expect(field.closest('[hidden]')).toBeNull()
    expect(field.value).toBe(LINK)
    expect(field.readOnly).toBe(true)
    expect(copy).not.toBeNull()

    showRoom(header, { indicator: 'expired', text: 'Room expired. Ask Claude to open Juicebox again.', joinLink: undefined })
    expect(field.closest('[hidden]')).not.toBeNull()
  })

  it('Copy puts the Join link on the clipboard and briefly says so', async () => {
    vi.useFakeTimers()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const header = createHeader()
    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: LINK })
    const copy = copyButton(header)

    copy.click()
    await vi.waitFor(() => expect(copy.textContent).toBe('Copied'))
    expect(writeText).toHaveBeenCalledWith(LINK)

    await vi.advanceTimersByTimeAsync(5000)
    expect(copy.textContent).toBe('Copy')
  })

  it('where the clipboard is refused, Copy leaves the Join link selected for the person to copy', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    const header = createHeader()
    document.body.append(header)
    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: LINK })
    const field = header.querySelector('[aria-label="Join link"]')

    copyButton(header).click()
    await vi.waitFor(() => expect([field.selectionStart, field.selectionEnd]).toEqual([0, LINK.length]))
    expect(document.activeElement).toBe(field)
    expect(copyButton(header)).not.toBeUndefined()
    header.remove()
  })

  it('one click in the Join link selects all of it', () => {
    const header = createHeader()
    document.body.append(header)
    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: LINK })
    const field = header.querySelector('[aria-label="Join link"]')

    field.click()
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, LINK.length])
    header.remove()
  })

  it('a tool call makes the Room indicator pulse once, briefly', () => {
    const header = createHeader()
    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: LINK })
    const indicator = header.querySelector('.room-indicator')

    showToolCall(header, 'go_to_locus')
    expect(indicator.classList.contains('room-indicator--pulsing')).toBe(true)

    endPulseCycle(indicator)
    expect(indicator.classList.contains('room-indicator--pulsing')).toBe(false)
    expect(indicator.classList.contains('room-indicator--joined')).toBe(true)
  })

  it('the Room indicator\'s tooltip and accessible label name the last tool run', () => {
    const header = createHeader()
    document.body.append(header)
    const indicator = header.querySelector('.room-indicator')

    showToolCall(header, 'load_map')
    showToolCall(header, 'go_to_locus')
    expect(indicator.title).toBe('Last tool: go_to_locus')
    expect(indicator.getAttribute('aria-hidden')).toBeNull()
    expect(indicator.getAttribute('role')).toBe('img')
    expect(indicator.getAttribute('aria-label')).toBe('Last tool: go_to_locus')

    showRoom(header, { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: LINK })
    expect(indicator.title).toBe('Last tool: go_to_locus')
    header.remove()
  })

  it('the Room changing mid-pulse changes the Room indicator\'s colour without cutting the pulse short', () => {
    const header = createHeader()
    const indicator = header.querySelector('.room-indicator')

    showToolCall(header, 'go_to_locus')
    showRoom(header, { indicator: 'connecting', text: 'Reconnecting…', joinLink: LINK })
    expect(indicator.classList.contains('room-indicator--connecting')).toBe(true)
    expect(indicator.classList.contains('room-indicator--pulsing')).toBe(true)
  })

  it('a burst of tool calls keeps the Room indicator pulsing, then stops at the end of a pulse with no backlog', () => {
    const header = createHeader()
    const indicator = header.querySelector('.room-indicator')

    // Five calls within one pulse earn it one more pulse, not five.
    for (let call = 0; call < 5; call++) showToolCall(header, 'go_to_locus')
    endPulseCycle(indicator)
    expect(indicator.classList.contains('room-indicator--pulsing')).toBe(true)
    endPulseCycle(indicator)
    expect(indicator.classList.contains('room-indicator--pulsing')).toBe(false)
  })

  it('has a button for the Juicebox Panel Controls, not clickable until juicebox.js has initialised', () => {
    const header = createHeader()
    expect(panelControlsButton(header).disabled).toBe(true)

    followPanelControls(header, fakeJuicebox())
    expect(panelControlsButton(header).disabled).toBe(false)
    expect(panelControlsButton(header).textContent).toBe('Hide controls')
    expect(panelControlsButton(header).getAttribute('aria-expanded')).toBe('true')
  })

  it('the Header\'s button hides the Juicebox Panel Controls, then shows them again', () => {
    const header = createHeader()
    const juicebox = fakeJuicebox()
    followPanelControls(header, juicebox)
    const button = panelControlsButton(header)

    button.click()
    expect(juicebox.isNavbarVisible()).toBe(false)
    expect(button.textContent).toBe('Show controls')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    button.click()
    expect(juicebox.isNavbarVisible()).toBe(true)
    expect(button.textContent).toBe('Hide controls')
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('reads "Show controls" when juicebox.js started with them hidden, as from a Snapshot link', () => {
    const header = createHeader()
    followPanelControls(header, fakeJuicebox(false))

    expect(panelControlsButton(header).textContent).toBe('Show controls')
    expect(panelControlsButton(header).getAttribute('aria-expanded')).toBe('false')
  })

  it('follows the Juicebox Panel Controls when something other than a click hides them, as the Remote does', () => {
    const header = createHeader()
    const juicebox = fakeJuicebox()
    followPanelControls(header, juicebox)

    juicebox.setNavbarVisible(false)
    expect(panelControlsButton(header).textContent).toBe('Show controls')
    expect(panelControlsButton(header).getAttribute('aria-expanded')).toBe('false')
  })

  it('the Header\'s button names the Panels whose Juicebox Panel Controls it hides', () => {
    const header = createHeader()
    expect(panelControlsButton(header).getAttribute('aria-controls')).toBe('panels')
  })
})
