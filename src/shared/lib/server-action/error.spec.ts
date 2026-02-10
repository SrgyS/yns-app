import { BadRequest, UnknownServerError } from '../errors'
import { parseServerActionError, serializeServerActionError } from './error'

describe('server action error serialization', () => {
  test('serializes and parses known and unknown errors', () => {
    const known = new BadRequest('Bad', ['field'])
    const knownDto = serializeServerActionError(known)
    const knownParsed = parseServerActionError(knownDto)

    expect(knownDto.errorType).toBe('BadRequest')
    expect(knownParsed).toBeInstanceOf(BadRequest)
    expect((knownParsed as BadRequest).errors).toEqual(['field'])

    const unknown = new Error('Boom')
    const unknownDto = serializeServerActionError(unknown)
    const unknownParsed = parseServerActionError(unknownDto)

    expect(unknownDto.errorType).toBe('UnknownServerError')
    expect(unknownParsed).toBeInstanceOf(UnknownServerError)
  })
})
