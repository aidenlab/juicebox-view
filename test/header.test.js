import { describe, it, expect } from 'vitest'
import { createHeader, showRoom } from '../src/header.js'

describe('Header', () => {
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
})
