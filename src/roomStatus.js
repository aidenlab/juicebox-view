/**
 * @typedef {'connecting'|'open'|'closed'|'expired'} RemoteStatus What the Remote reports through onStatus.
 */

/**
 * @typedef {object} RoomStatus What the Header shows of the Room.
 * @property {'connecting'|'joined'|'expired'} indicator the Room indicator's state: amber, green or red
 * @property {string} text the Header's status text
 */

/**
 * Follows the Remote's statuses and says what the Header shows for each.
 *
 * @returns {(status: RemoteStatus, room: string|undefined) => RoomStatus}
 */
export function followRoom() {
  // The Remote reports 'connecting' before every retry too; once the connection has
  // dropped, each of those is still a reconnect until the Room answers.
  let dropped = false

  return (status, room) => {
    if (status === 'open') {
      dropped = false
      return { indicator: 'joined', text: `Joined room ${room}` }
    }
    if (status === 'expired') return { indicator: 'expired', text: 'Room expired. Ask Claude to open Juicebox again.' }
    if (status === 'closed') dropped = true
    return { indicator: 'connecting', text: dropped ? 'Reconnecting…' : 'Connecting…' }
  }
}
