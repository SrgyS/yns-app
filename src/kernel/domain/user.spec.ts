import { ROLES } from './user'

describe('user roles', () => {
  test('ROLES exposes identity mapping for known roles', () => {
    expect(ROLES.ADMIN).toBe('ADMIN')
    expect(ROLES.USER).toBe('USER')
    expect(ROLES.STAFF).toBe('STAFF')
  })
})
