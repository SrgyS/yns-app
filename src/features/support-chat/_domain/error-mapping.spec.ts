import { mapSupportChatDomainErrorToTrpc } from './error-mapping'
import { createSupportChatError } from './errors'

describe('support chat error mapping', () => {
  test('maps DIALOG_ACCESS_DENIED to FORBIDDEN', () => {
    const error = mapSupportChatDomainErrorToTrpc(
      createSupportChatError('DIALOG_ACCESS_DENIED')
    )

    expect(error.code).toBe('FORBIDDEN')
    expect(error.message).toBe('У вас нет доступа к этому диалогу')
  })

  test('maps MESSAGE_NOT_FOUND to NOT_FOUND', () => {
    const error = mapSupportChatDomainErrorToTrpc(
      createSupportChatError('MESSAGE_NOT_FOUND')
    )

    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Диалог или сообщение не найдено')
  })

  test('maps INVALID_MESSAGE to BAD_REQUEST', () => {
    const error = mapSupportChatDomainErrorToTrpc(
      createSupportChatError('INVALID_MESSAGE')
    )

    expect(error.code).toBe('BAD_REQUEST')
    expect(error.message).toBe('Некорректное сообщение или вложение')
  })
})
