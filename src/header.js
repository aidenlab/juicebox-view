/** What the Header says while the Page is in no Room. */
const NOT_IN_A_ROOM = 'Not in a room. Ask Claude to open Juicebox.'

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
  indicator.setAttribute('aria-hidden', 'true')

  const status = document.createElement('p')
  status.className = 'header__status'
  status.setAttribute('role', 'status')
  status.textContent = NOT_IN_A_ROOM

  header.append(indicator, status)
  return header
}

/**
 * Shows the Room in the Header: the Room indicator's colour and the status text.
 *
 * @param {HTMLElement} header from createHeader
 * @param {import('./roomStatus.js').RoomStatus} view
 */
export function showRoom(header, { indicator, text }) {
  header.querySelector('.room-indicator').className = `room-indicator room-indicator--${indicator}`
  header.querySelector('.header__status').textContent = text
}
