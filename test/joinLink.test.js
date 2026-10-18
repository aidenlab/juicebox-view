import { describe, it, expect } from 'vitest'
import { joinLink } from '../src/joinLink.js'

describe('Join link', () => {
  it('is the Page address carrying ?room=', () => {
    expect(joinLink('http://localhost:5173/', 'k3x9q2')).toBe('http://localhost:5173/?room=k3x9q2')
  })

  it('drops every other parameter, a Snapshot link’s ?session= included', () => {
    expect(joinLink('https://example.org/view/?session=blob:abc&room=k3x9q2&foo=1#top', 'k3x9q2'))
      .toBe('https://example.org/view/?room=k3x9q2')
  })
})
