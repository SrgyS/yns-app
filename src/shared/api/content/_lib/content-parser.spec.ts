import { ContentParser } from './content-parser'
import { ParsingError } from '@/shared/lib/errors'

describe('ContentParser', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('parses valid yaml and applies schema + metadata', async () => {
    const parser = new ContentParser()
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
      },
      required: ['title', 'slug'],
      additionalProperties: false,
    }

    const result = await parser.parse<{ title: string; slug: string }>(
      'title: Hello',
      schema,
      { slug: 'demo' }
    )

    expect(result).toEqual({ title: 'Hello', slug: 'demo' })
  })

  test('throws ParsingError on schema validation failure', async () => {
    const parser = new ContentParser()
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
      required: ['count'],
      additionalProperties: false,
    }

    await expect(parser.parse('count: nope', schema)).rejects.toBeInstanceOf(
      ParsingError
    )
  })
})
