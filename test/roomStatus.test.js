import { describe, it, expect } from 'vitest'
import { followRoom } from '../src/roomStatus.js'

describe('Room status', () => {
  it('while the Remote connects, the Room indicator is amber and says Connecting…', () => {
    const show = followRoom()

    expect(show('connecting', undefined)).toEqual({ indicator: 'connecting', text: 'Connecting…' })
  })

  it('once the Room answers, the Room indicator is green and names the Room', () => {
    const show = followRoom()
    show('connecting', undefined)

    expect(show('open', 'k3x9q2')).toEqual({ indicator: 'joined', text: 'Joined room k3x9q2' })
  })

  it('when the connection drops, says Reconnecting… through every retry until the Room answers again', () => {
    const show = followRoom()
    show('connecting', undefined)
    show('open', 'k3x9q2')

    const reconnecting = { indicator: 'connecting', text: 'Reconnecting…' }
    expect(show('closed', 'k3x9q2')).toEqual(reconnecting)
    expect(show('connecting', 'k3x9q2')).toEqual(reconnecting)
    expect(show('closed', 'k3x9q2')).toEqual(reconnecting)
    expect(show('connecting', 'k3x9q2')).toEqual(reconnecting)
    expect(show('open', 'k3x9q2')).toEqual({ indicator: 'joined', text: 'Joined room k3x9q2' })
  })

  it('an expired Room turns the Room indicator red and asks the person to have Claude open Juicebox again', () => {
    const show = followRoom()
    show('connecting', undefined)

    expect(show('expired', undefined)).toEqual({
      indicator: 'expired',
      text: 'Room expired. Ask Claude to open Juicebox again.',
    })
  })
})
