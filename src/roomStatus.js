import { joinLink } from './joinLink.js'

/**
 * @typedef {'connecting'|'open'|'closed'|'expired'} RemoteStatus What the Remote reports through onStatus.
 */

/**
 * @typedef {object} RoomStatus What the Header shows of the Room.
 * @property {'connecting'|'joined'|'expired'} indicator the Room indicator's state: amber, green or red
 * @property {string} text the Header's status text
 * @property {string|undefined} joinLink the Room's Join link, shown once joined and while
 *   reconnecting; undefined while first connecting and once the Room has expired
 */

/**
 * Follows the Remote's statuses and says what the Header shows for each.
 *
 * @param {string} pageAddress the Page's address, as location.href, from which the Join link is built
 * @returns {(status: RemoteStatus, room: string|undefined) => RoomStatus}
 */
export function followRoom(pageAddress) {
  // The Remote reports 'connecting' before every retry too; once the connection has
  // dropped, each of those is still a reconnect until the Room answers.
  let dropped = false
  // The Join link, from the first time the Room answers until it expires.
  let link

  return (status, room) => {
    if (status === 'open') {
      dropped = false
      link = joinLink(pageAddress, room)
      return { indicator: 'joined', text: `Joined room ${room}`, joinLink: link }
    }
    if (status === 'expired') {
      link = undefined
      return { indicator: 'expired', text: 'Room expired. Ask Claude to open Juicebox again.', joinLink: link }
    }
    if (status === 'closed') dropped = true
    return { indicator: 'connecting', text: dropped ? 'Reconnecting…' : 'Connecting…', joinLink: link }
  }
}
