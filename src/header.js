/** What the Header says while the Page is in no Room. */
const NOT_IN_A_ROOM = 'Not in a room. Ask Claude to open Juicebox.'

/** How long Copy says Copied, in milliseconds. */
const COPIED_FOR = 1500

/** Room indicators that a tool call reached mid-pulse, owed one more pulse. */
const pulseAgain = new WeakSet()

/**
 * The Header: the strip above juicebox.js holding what the Page shows about itself.
 * It starts in the no-Room state, its Room indicator grey.
 *
 * @returns {HTMLElement}
 */
export function createHeader() {
  const header = document.createElement('header')
  header.className = 'header'

  const indicator = document.createElement('span')
  indicator.className = 'room-indicator'
  // Hidden from assistive technology until a tool call gives it something to say.
  indicator.setAttribute('aria-hidden', 'true')
  // A pulse ends with its cycle, so the dot never snaps back mid-pulse; a call during the
  // cycle runs one more, so a burst keeps pulsing rather than queueing.
  indicator.addEventListener('animationiteration', () => {
    if (pulseAgain.delete(indicator)) return
    indicator.classList.remove('room-indicator--pulsing')
  })

  const status = document.createElement('p')
  status.className = 'header__status'
  status.setAttribute('role', 'status')
  status.textContent = NOT_IN_A_ROOM

  // The Join link and its Copy button, hidden until the Page has joined a Room.
  const join = document.createElement('div')
  join.className = 'header__join'
  join.hidden = true

  const link = document.createElement('input')
  link.className = 'header__join-link'
  link.readOnly = true
  link.setAttribute('aria-label', 'Join link')
  link.addEventListener('click', () => link.select())

  const copy = document.createElement('button')
  copy.className = 'header__copy'
  copy.type = 'button'
  copy.textContent = 'Copy'
  let copiedTimer
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link.value)
    } catch {
      // Refused the clipboard, or given none outside a secure context: the person copies it.
      link.focus()
      link.select()
      return
    }
    copy.textContent = 'Copied'
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copy.textContent = 'Copy' }, COPIED_FOR)
  })

  join.append(link, copy)
  header.append(indicator, status, join)
  return header
}

/**
 * Shows the Room in the Header: the Room indicator's colour, the status text and, when
 * there is one, the Join link.
 *
 * @param {HTMLElement} header from createHeader
 * @param {import('./roomStatus.js').RoomStatus} view
 */
export function showRoom(header, { indicator, text, joinLink }) {
  const dot = header.querySelector('.room-indicator')
  dot.classList.remove('room-indicator--connecting', 'room-indicator--joined', 'room-indicator--expired')
  dot.classList.add(`room-indicator--${indicator}`)
  header.querySelector('.header__status').textContent = text
  header.querySelector('.header__join').hidden = !joinLink
  header.querySelector('.header__join-link').value = joinLink ?? ''
}

/**
 * Shows that the model ran a tool against the Page: the Room indicator pulses once.
 *
 * @param {HTMLElement} header from createHeader
 * @param {string} name the tool's name
 */
export function showToolCall(header, name) {
  const indicator = header.querySelector('.room-indicator')
  const lastTool = `Last tool: ${name}`
  indicator.removeAttribute('aria-hidden')
  indicator.setAttribute('role', 'img')
  indicator.setAttribute('aria-label', lastTool)
  indicator.title = lastTool
  if (indicator.classList.contains('room-indicator--pulsing')) pulseAgain.add(indicator)
  else indicator.classList.add('room-indicator--pulsing')
}
