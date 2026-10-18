import { describe, it, expect } from 'vitest'
import { followRoom } from '../src/roomStatus.js'

const PAGE = 'http://localhost:5173/?room=k3x9q2'
const JOINED = { indicator: 'joined', text: 'Joined room k3x9q2', joinLink: 'http://localhost:5173/?room=k3x9q2' }

describe('Room status', () => {
  it('while the Remote connects, the Room indicator is amber and says Connecting…', () => {
    const show = followRoom(PAGE)

    expect(show('connecting', undefined)).toEqual({ indicator: 'connecting', text: 'Connecting…' })
  })

  it('once the Room answers, the Room indicator is green and names the Room', () => {
    const show = followRoom(PAGE)
    show('connecting', undefined)

    expect(show('open', 'k3x9q2')).toEqual(JOINED)
  })

  it('when the connection drops, says Reconnecting… through every retry until the Room answers again', () => {
    const show = followRoom(PAGE)
    show('connecting', undefined)
    show('open', 'k3x9q2')

    const reconnecting = { indicator: 'connecting', text: 'Reconnecting…', joinLink: JOINED.joinLink }
    expect(show('closed', 'k3x9q2')).toEqual(reconnecting)
    expect(show('connecting', 'k3x9q2')).toEqual(reconnecting)
    expect(show('closed', 'k3x9q2')).toEqual(reconnecting)
    expect(show('connecting', 'k3x9q2')).toEqual(reconnecting)
    expect(show('open', 'k3x9q2')).toEqual(JOINED)
  })

  it('an expired Room turns the Room indicator red and asks the person to have Claude open Juicebox again', () => {
    const show = followRoom(PAGE)
    show('connecting', undefined)

    expect(show('expired', undefined)).toEqual({
      indicator: 'expired',
      text: 'Room expired. Ask Claude to open Juicebox again.',
    })
  })

  it('shows the Join link only once the Room has answered, and not while first connecting', () => {
    const show = followRoom(PAGE)

    expect(show('connecting', undefined).joinLink).toBeUndefined()
    expect(show('open', 'k3x9q2').joinLink).toBe('http://localhost:5173/?room=k3x9q2')
  })

  it('takes the Join link away once the Room has expired', () => {
    const show = followRoom(PAGE)
    show('open', 'k3x9q2')
    show('closed', 'k3x9q2')

    expect(show('expired', undefined).joinLink).toBeUndefined()
    expect(show('connecting', undefined).joinLink).toBeUndefined()
  })
})
