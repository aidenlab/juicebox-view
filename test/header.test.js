import { describe, it, expect } from 'vitest'
import { createHeader } from '../src/header.js'

describe('Header', () => {
  it('with no Room, shows a grey Room indicator and asks the person to have Claude open Juicebox', () => {
    const header = createHeader()

    const indicator = header.querySelector('.room-indicator')
    expect(indicator).not.toBeNull()
    expect(indicator.classList.contains('room-indicator--joined')).toBe(false)

    expect(header.querySelector('[role="status"]').textContent).toBe('Not in a room. Ask Claude to open Juicebox.')
  })
})
