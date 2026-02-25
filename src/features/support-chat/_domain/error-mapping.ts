import { TRPCError } from '@trpc/server'

import { SupportChatDomainError } from './errors'

export const mapSupportChatDomainErrorToTrpc = (
  error: SupportChatDomainError
): TRPCError => {
  if (error.code === 'DIALOG_NOT_FOUND' || error.code === 'MESSAGE_NOT_FOUND') {
    return new TRPCError({
      code: 'NOT_FOUND',
      message: 'Диалог или сообщение не найдено',
    })
  }

  if (
    error.code === 'DIALOG_ACCESS_DENIED' ||
    error.code === 'STAFF_PERMISSION_DENIED'
  ) {
    return new TRPCError({
      code: 'FORBIDDEN',
      message: 'У вас нет доступа к этому диалогу',
    })
  }

  if (error.code === 'INVALID_MESSAGE') {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Некорректное сообщение или вложение',
    })
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ошибка сервера. Попробуйте позже',
  })
}
