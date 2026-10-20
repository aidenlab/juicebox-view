import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildLabel, createHeader, showRoom, showToolCall } from '../src/header.js'

const LINK = 'http://localhost:5173/?room=k3x9q2'

/** Ends one cycle of the Room indicator's pulse, as the browser does. @param {HTMLElement} indicator */
function endPulseCycle(indicator) {
  indicator.dispatchEvent(new Event('animationiteration'))
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

  it('shows no build label unless given one, and a given one at its end', () => {
    expect(createHeader().querySelector('.header__build')).toBeNull()

    const header = createHeader('Build 24 (b99e44e) · https://juicebot-view-mcp-dev.3dg.io/mcp')
    expect(header.lastElementChild.textContent).toBe('Build 24 (b99e44e) · https://juicebot-view-mcp-dev.3dg.io/mcp')
  })
})

describe('build label', () => {
  it('is the build number and the MCP connector URL a deploy baked in', () => {
    expect(buildLabel({ VITE_BUILD: '24 (b99e44e)', VITE_MCP_URL: 'https://juicebot-view-mcp-dev.3dg.io/mcp' }))
      .toBe('Build 24 (b99e44e) · https://juicebot-view-mcp-dev.3dg.io/mcp')
    expect(buildLabel({ VITE_BUILD: '24 (b99e44e-dirty)' })).toBe('Build 24 (b99e44e-dirty)')
  })

  it('is absent with no build number, as in npm run dev', () => {
    expect(buildLabel({ VITE_MCP_URL: 'https://juicebot-view-mcp-dev.3dg.io/mcp' })).toBeUndefined()
  })
})
