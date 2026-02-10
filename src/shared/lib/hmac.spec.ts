import { Hmac } from './hmac'

describe('Hmac', () => {
  test('creates deterministic signatures and verifies them', () => {
    const dataA = { b: '2', a: '1' }
    const dataB = { a: '1', b: '2' }
    const key = 'secret'

    const signA = Hmac.create(dataA, key)
    const signB = Hmac.create(dataB, key)

    expect(signA).toBe(signB)
    expect(signA).not.toBe(false)

    if (signA) {
      expect(Hmac.verify(dataB, key, signA)).toBe(true)
    }

    expect(Hmac.create(dataA, key, 'nope')).toBe(false)
  })
})
