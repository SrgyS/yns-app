import { BadRequest } from './errors'

describe('BadRequest', () => {
  test('serializes and restores message + errors', () => {
    const error = new BadRequest('Invalid', ['field'])
    const json = error.toJSON()
    const restored = BadRequest.fromJSON(json)

    expect(restored).toBeInstanceOf(BadRequest)
    expect(restored.message).toBe('Invalid')
    expect(restored.errors).toEqual(['field'])
  })
})
