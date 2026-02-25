import { getProfileDisplayName } from './get-profile-display-name'

describe('getProfileDisplayName', () => {
  test('prefers name over email', () => {
    expect(getProfileDisplayName({ name: 'Anna', email: 'a@b.com' })).toBe(
      'Anna'
    )
    expect(getProfileDisplayName({ name: '', email: 'a@b.com' })).toBe('a@b.com')
    expect(getProfileDisplayName({ email: 'a@b.com' })).toBe('a@b.com')
  })
})
