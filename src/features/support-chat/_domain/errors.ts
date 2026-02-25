export type SupportChatErrorCode =
  | 'DIALOG_NOT_FOUND'
  | 'DIALOG_ACCESS_DENIED'
  | 'STAFF_PERMISSION_DENIED'
  | 'INVALID_MESSAGE'
  | 'MESSAGE_NOT_FOUND'

export class SupportChatDomainError extends Error {
  constructor(
    public readonly code: SupportChatErrorCode,
    message?: string
  ) {
    super(message ?? code)
    this.name = 'SupportChatDomainError'
  }
}

export const createSupportChatError = (
  code: SupportChatErrorCode,
  message?: string
): SupportChatDomainError => new SupportChatDomainError(code, message)

export const isSupportChatDomainError = (
  error: unknown
): error is SupportChatDomainError => error instanceof SupportChatDomainError
