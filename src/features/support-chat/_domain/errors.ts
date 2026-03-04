export type SupportChatErrorCode =
  | 'DIALOG_NOT_FOUND'
  | 'DIALOG_ACCESS_DENIED'
  | 'STAFF_PERMISSION_DENIED'
  | 'TARGET_USER_NOT_FOUND'
  | 'TARGET_USER_INVALID_ROLE'
  | 'INVALID_MESSAGE'
  | 'MESSAGE_NOT_FOUND'
  | 'MESSAGE_ACTION_FORBIDDEN'
  | 'MESSAGE_ALREADY_READ'
  | 'MESSAGE_ALREADY_DELETED'

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
