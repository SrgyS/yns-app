jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    supportDialog: {
      findMany: jest.fn(),
    },
    supportMessage: {
      findFirst: jest.fn(),
    },
    staffPermission: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/shared/lib/file-storage/file-storage', () => ({
  fileStorage: {
    uploadFile: jest.fn(),
  },
}))

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('../_integrations/support-chat-events', () => ({
  publishSupportChatEvent: jest.fn(),
}))

import { dbClient } from '@/shared/lib/db'
import { SupportChatService } from './support-chat-service'
import { SupportChatDomainError } from '../_domain/errors'

describe('SupportChatService', () => {
  const conversationRepository = {
    findById: jest.fn(),
    touchLastMessageAt: jest.fn(),
    create: jest.fn(),
  }
  const messageRepository = {
    create: jest.fn(),
    listByDialog: jest.fn(),
  }
  const readStateRepository = {
    findByDialogAndReader: jest.fn(),
    upsert: jest.fn(),
  }
  const readService = {
    countUnreadForUser: jest.fn(),
    countUnreadForStaff: jest.fn(),
    hasUnansweredIncoming: jest.fn(),
  }
  const notifier = {
    notifyNewUserMessage: jest.fn().mockResolvedValue(undefined),
  }

  const service = new SupportChatService(
    conversationRepository as any,
    messageRepository as any,
    readStateRepository as any,
    readService as any,
    notifier as any
  )

  beforeEach(() => {
    conversationRepository.findById.mockReset()
    conversationRepository.touchLastMessageAt.mockReset()
    conversationRepository.create.mockReset()
    messageRepository.create.mockReset()
    messageRepository.listByDialog.mockReset()
    readStateRepository.findByDialogAndReader.mockReset()
    readStateRepository.upsert.mockReset()
    readService.countUnreadForUser.mockReset()
    readService.countUnreadForStaff.mockReset()
    readService.hasUnansweredIncoming.mockReset()
    notifier.notifyNewUserMessage.mockClear()
    ;(dbClient.supportMessage.findFirst as jest.Mock).mockReset()
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockReset()
  })

  test('sendMessage rejects empty message without attachments', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
    })

    await expect(
      service.sendMessage({
        actor: { id: 'user-1', role: 'USER' },
        dialogId: 'dialog-1',
        text: '   ',
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'INVALID_MESSAGE',
    })
  })

  test('userGetMessages blocks access to foreign dialog', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'owner-user',
    })

    await expect(
      service.userGetMessages({
        actor: { id: 'another-user', role: 'USER' },
        dialogId: 'dialog-1',
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'DIALOG_ACCESS_DENIED',
    })
  })

  test('staffListDialogs rejects staff without permission', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      service.staffListDialogs({
        actor: { id: 'staff-1', role: 'STAFF' },
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'STAFF_PERMISSION_DENIED',
    })
  })

  test('markDialogRead returns not found when message is absent in dialog', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
    })
    ;(dbClient.supportMessage.findFirst as jest.Mock).mockResolvedValue(null)

    await expect(
      service.markDialogRead({
        actor: { id: 'user-1', role: 'USER' },
        dialogId: 'dialog-1',
        lastReadMessageId: 'msg-404',
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'MESSAGE_NOT_FOUND',
    })
  })
})
