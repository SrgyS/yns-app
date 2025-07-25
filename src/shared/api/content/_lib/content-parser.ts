import Ajv from 'ajv'
import * as Yaml from 'yaml'
import addFormats from 'ajv-formats'
import { ParsingError, ValidationError } from '@/shared/lib/errors'

export class ContentParser {
  private ajv = new Ajv({
    strict: false,
    allErrors: true,
  })

  constructor() {
    addFormats(this.ajv)
  }

  async parse<T>(
    text: string,
    schema: object,
    metadata?: { slug?: string }
  ): Promise<T> {
    try {
      const parsedObject: unknown = await Yaml.parse(text)
      if (parsedObject === null || typeof parsedObject !== 'object') {
        throw new ParsingError(
          text,
          'Parsed YAML content is not a valid object. It might be empty or malformed.',
          null
        )
      }

      const dataToValidate = { ...parsedObject, ...metadata }
      console.log({ dataToValidate })
      if (this.ajv.validate(schema, dataToValidate)) {
        console.log('valid')
        return dataToValidate as T
      } else {
        console.error('AJV errors:', this.ajv.errors)
        throw new ValidationError([...(this.ajv.errors ?? [])])
      }
    } catch (error) {
      throw new ParsingError(text, 'ContentParsing error', error)
    }
  }
}
