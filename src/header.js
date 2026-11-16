/** What the Header says while the Page is in no Room. */
const NOT_IN_A_ROOM = 'Not in a room. Ask Claude to open Juicebox.'

/** The id of the element holding the Panels, whose Juicebox Panel Controls the Header's button hides. */
const PANELS_ID = 'panels'

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

  // Hides and shows the Juicebox Panel Controls; clickable once juicebox.js has initialised.
  const panelControls = document.createElement('button')
  panelControls.className = 'header__panel-controls'
  panelControls.type = 'button'
  panelControls.disabled = true
  panelControls.setAttribute('aria-controls', PANELS_ID)
  labelPanelControlsButton(panelControls, true)

  header.append(indicator, status, panelControls)
  return header
}

/**
 * Shows the Room in the Header: the Room indicator's colour and the status text.
 *
 * @param {HTMLElement} header from createHeader
 * @param {import('./roomStatus.js').RoomStatus} view
 */
export function showRoom(header, { indicator, text }) {
  const dot = header.querySelector('.room-indicator')
  dot.classList.remove('room-indicator--connecting', 'room-indicator--joined', 'room-indicator--expired')
  dot.classList.add(`room-indicator--${indicator}`)
  header.querySelector('.header__status').textContent = text
}

/**
 * Makes the Header's button hide and show the Juicebox Panel Controls on every Panel.
 * A click goes to juicebox.js's setter; the label follows juicebox.js's change event, so it
 * stays right whatever changed the state.
 *
 * @param {HTMLElement} header from createHeader
 * @param {typeof import('juicebox.js').default} juicebox after juicebox.init
 */
export function followPanelControls(header, juicebox) {
  const button = header.querySelector('.header__panel-controls')
  button.addEventListener('click', () => juicebox.setNavbarVisible(!juicebox.isNavbarVisible()))
  juicebox.EventBus.globalBus.subscribe('NavbarVisibilityChange', ({ data }) => labelPanelControlsButton(button, data.visible))
  // A Snapshot link saved while hidden has already hidden them in juicebox.init.
  labelPanelControlsButton(button, juicebox.isNavbarVisible())
  button.disabled = false
}

/**
 * Labels the Header's button for whether the Juicebox Panel Controls are shown.
 *
 * @param {HTMLButtonElement} button
 * @param {boolean} visible
 */
function labelPanelControlsButton(button, visible) {
  button.textContent = visible ? 'Hide controls' : 'Show controls'
  button.setAttribute('aria-expanded', String(visible))
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
