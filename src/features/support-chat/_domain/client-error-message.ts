const DEFAULT_ERROR_MESSAGE = 'Произошла ошибка. Попробуйте позже'

const MESSAGE_BY_CODE: Record<string, string> = {
  INTERNAL_SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
  FORBIDDEN: 'У вас нет доступа к этому действию',
  BAD_REQUEST: 'Проверьте введенные данные и попробуйте снова',
  NOT_FOUND: 'Запрошенные данные не найдены',
  UNAUTHORIZED: 'Требуется авторизация',
}

export const resolveSupportChatClientErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  if (!(error instanceof Error)) {
    return fallbackMessage
  }

  const knownMessage = MESSAGE_BY_CODE[error.message]
  if (knownMessage) {
    return knownMessage
  }

  if (error.message.trim().length > 0) {
    return error.message
  }

  return DEFAULT_ERROR_MESSAGE
}

