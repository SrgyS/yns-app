jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    chatDialog: {
      findMany: jest.fn(),
    },
    chatMessage: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    supportReadState: {
      findFirst: jest.fn(),
    },
    staffPermission: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/shared/lib/file-storage/file-storage', () => ({
  fileStorage: {
    uploadFile: jest.fn(),
    deleteByPath: jest.fn(),
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
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { SupportChatService } from './support-chat-service'
import { SupportChatDomainError } from '../_domain/errors'
import { publishSupportChatEvent } from '../_integrations/support-chat-events'

describe('SupportChatService', () => {
  const attachmentRepository = {
    createUploaded: jest.fn(),
    linkToMessage: jest.fn(),
    listByMessage: jest.fn(),
    deleteByIds: jest.fn(),
  }
  const conversationRepository = {
    findById: jest.fn(),
    findByUserIdUnique: jest.fn(),
    createOrReturnCanonical: jest.fn(),
    touchLastMessageAt: jest.fn(),
    create: jest.fn(),
  }
  const messageRepository = {
    create: jest.fn(),
    findByDialogAndClientMessageId: jest.fn(),
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
  const userRepository = {
    findUserById: jest.fn(),
  }

  const service = new SupportChatService(
    attachmentRepository as any,
    conversationRepository as any,
    messageRepository as any,
    readStateRepository as any,
    readService as any,
    notifier as any,
    userRepository as any
  )

  beforeEach(() => {
    attachmentRepository.createUploaded.mockReset()
    attachmentRepository.linkToMessage.mockReset()
    attachmentRepository.listByMessage.mockReset()
    attachmentRepository.deleteByIds.mockReset()
    conversationRepository.findById.mockReset()
    conversationRepository.findByUserIdUnique.mockReset()
    conversationRepository.createOrReturnCanonical.mockReset()
    conversationRepository.touchLastMessageAt.mockReset()
    conversationRepository.create.mockReset()
    messageRepository.create.mockReset()
    messageRepository.findByDialogAndClientMessageId.mockReset()
    messageRepository.listByDialog.mockReset()
    readStateRepository.findByDialogAndReader.mockReset()
    readStateRepository.upsert.mockReset()
    readService.countUnreadForUser.mockReset()
    readService.countUnreadForStaff.mockReset()
    readService.hasUnansweredIncoming.mockReset()
    notifier.notifyNewUserMessage.mockClear()
    userRepository.findUserById.mockReset()
    ;(fileStorage.uploadFile as jest.Mock).mockReset()
    ;(fileStorage.deleteByPath as jest.Mock).mockReset()
    ;(dbClient.chatMessage.findFirst as jest.Mock).mockReset()
    ;(dbClient.chatMessage.update as jest.Mock).mockReset()
    ;(dbClient.supportReadState.findFirst as jest.Mock).mockReset()
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockReset()
    ;(dbClient.$queryRaw as jest.Mock).mockReset()
    ;(publishSupportChatEvent as jest.Mock).mockReset()
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

  test('staffListDialogs marks unanswered based on latest user vs staff message', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue({
      canManageSupportChats: true,
    })
    ;(dbClient.chatDialog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'dialog-1',
        user: {
          id: 'user-1',
          name: 'User One',
          image: null,
        },
        lastMessageAt: new Date('2026-03-05T10:00:00.000Z'),
      },
    ])
    ;(dbClient.chatMessage.findFirst as jest.Mock).mockResolvedValue({
      id: 'msg-1',
      senderType: 'USER',
      text: 'Need help',
      createdAt: new Date('2026-03-05T10:00:00.000Z'),
    })
    readService.countUnreadForStaff.mockResolvedValue(0)
    readService.hasUnansweredIncoming.mockResolvedValue(true)

    const result = await service.staffListDialogs({
      actor: { id: 'staff-1', role: 'STAFF' },
    })

    expect(readService.hasUnansweredIncoming).toHaveBeenCalledWith('dialog-1')
    expect(result.items).toEqual([
      expect.objectContaining({
        dialogId: 'dialog-1',
        hasUnansweredIncoming: true,
        isUnanswered: true,
      }),
    ])
  })

  test('staffOpenDialogForUser reuses existing canonical dialog', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue({
      canManageSupportChats: true,
    })
    userRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
    })
    conversationRepository.findByUserIdUnique.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
      createdAt: new Date('2026-03-04T10:00:00.000Z'),
    })

    const result = await service.staffOpenDialogForUser({
      actor: { id: 'staff-1', role: 'STAFF' },
      userId: 'user-1',
    })

    expect(result).toEqual({
      dialogId: 'dialog-1',
      userId: 'user-1',
      created: false,
      createdAt: '2026-03-04T10:00:00.000Z',
    })
    expect(conversationRepository.createOrReturnCanonical).not.toHaveBeenCalled()
    expect(publishSupportChatEvent).not.toHaveBeenCalled()
  })

  test('staffOpenDialogForUser creates canonical dialog when missing', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue({
      canManageSupportChats: true,
    })
    userRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
    })
    conversationRepository.findByUserIdUnique.mockResolvedValue(null)
    conversationRepository.createOrReturnCanonical.mockResolvedValue({
      dialog: {
        id: 'dialog-2',
        userId: 'user-1',
        createdAt: new Date('2026-03-04T11:00:00.000Z'),
      },
      created: true,
    })

    const result = await service.staffOpenDialogForUser({
      actor: { id: 'admin-1', role: 'ADMIN' },
      userId: 'user-1',
    })

    expect(conversationRepository.createOrReturnCanonical).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        lastMessageAt: expect.any(Date),
      })
    )
    expect(publishSupportChatEvent).toHaveBeenCalledWith({
      type: 'dialog.created',
      dialogId: 'dialog-2',
      userId: 'user-1',
      occurredAt: '2026-03-04T11:00:00.000Z',
    })
    expect(result.created).toBe(true)
  })

  test('staffOpenDialogForUser rejects missing target user', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue({
      canManageSupportChats: true,
    })
    userRepository.findUserById.mockResolvedValue(null)
    await expect(
      service.staffOpenDialogForUser({
        actor: { id: 'staff-1', role: 'STAFF' },
        userId: 'user-404',
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'TARGET_USER_NOT_FOUND',
    })
  })

  test('staffOpenDialogForUser rejects non-user target role', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue({
      canManageSupportChats: true,
    })
    userRepository.findUserById.mockResolvedValue({
      id: 'admin-2',
      role: 'ADMIN',
    })
    await expect(
      service.staffOpenDialogForUser({
        actor: { id: 'staff-1', role: 'STAFF' },
        userId: 'admin-2',
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'TARGET_USER_INVALID_ROLE',
    })
  })

  test('markDialogRead returns not found when message is absent in dialog', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
    })
    ;(dbClient.chatMessage.findFirst as jest.Mock).mockResolvedValue(null)

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

  test('sendMessage persists uploaded attachments and links them to message', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
    })
    ;(dbClient.chatMessage.findFirst as jest.Mock).mockResolvedValue({
      text: 'msg',
      createdAt: new Date(),
    })
    readService.countUnreadForUser.mockResolvedValue(0)
    readService.countUnreadForStaff.mockResolvedValue(0)
    messageRepository.create.mockResolvedValue({
      id: 'message-1',
      dialogId: 'dialog-1',
      clientMessageId: 'srv_1',
      senderType: 'USER',
      text: 'hello',
      attachments: [],
      createdAt: new Date(),
    })
    ;(fileStorage.uploadFile as jest.Mock).mockResolvedValue({
      id: 'storage-file-1',
      name: 'image.png',
      type: 'image/png',
      path: 'private/support-chat/user-1/file.png',
      prefix: '/storage',
      eTag: 'etag-1',
    })
    attachmentRepository.createUploaded.mockResolvedValue({
      id: 'attachment-1',
      dialogId: 'dialog-1',
      messageId: null,
      storagePath: 'private/support-chat/user-1/file.png',
      mimeType: 'image/png',
      sizeBytes: 4,
      originalName: 'image.png',
      createdByUserId: 'user-1',
      status: 'UPLOADED',
      etag: 'etag-1',
      lastModified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    attachmentRepository.linkToMessage.mockResolvedValue({
      id: 'attachment-1',
      dialogId: 'dialog-1',
      messageId: 'message-1',
      storagePath: 'private/support-chat/user-1/file.png',
      mimeType: 'image/png',
      sizeBytes: 4,
      originalName: 'image.png',
      createdByUserId: 'user-1',
      status: 'LINKED',
      etag: 'etag-1',
      lastModified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await service.sendMessage({
      actor: { id: 'user-1', role: 'USER' },
      dialogId: 'dialog-1',
      text: 'hello',
      attachments: [
        {
          filename: 'image.png',
          mimeType: 'image/png',
          sizeBytes: 4,
          base64: Buffer.from([1, 2, 3, 4]).toString('base64'),
        },
      ],
    })

    expect(attachmentRepository.createUploaded).toHaveBeenCalledWith(
      expect.objectContaining({
        dialogId: 'dialog-1',
        createdByUserId: 'user-1',
      })
    )
    expect(attachmentRepository.linkToMessage).toHaveBeenCalledWith({
      id: 'attachment-1',
      dialogId: 'dialog-1',
      messageId: 'message-1',
    })
    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientMessageId: expect.any(String),
        attachments: [
          expect.objectContaining({
            id: 'attachment-1',
            path: 'private/support-chat/user-1/file.png',
          }),
        ],
      })
    )
    expect(result.message.id).toBe('message-1')
    expect(result.message.clientMessageId).toBeTruthy()
  })

  test('sendMessage returns existing message for repeated clientMessageId', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
      updatedAt: new Date('2026-03-05T08:00:00.000Z'),
    })
    messageRepository.findByDialogAndClientMessageId.mockResolvedValue({
      id: 'message-existing',
      dialogId: 'dialog-1',
      clientMessageId: 'tmp_abc123',
      senderType: 'USER',
      senderUserId: 'user-1',
      senderStaffId: null,
      text: 'hello',
      attachments: [],
      editedAt: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: new Date('2026-03-05T08:00:00.000Z'),
    })
    readService.countUnreadForUser.mockResolvedValue(1)
    readService.countUnreadForStaff.mockResolvedValue(0)

    const result = await service.sendMessage({
      actor: { id: 'user-1', role: 'USER' },
      dialogId: 'dialog-1',
      text: 'hello',
      clientMessageId: 'tmp_abc123',
    })

    expect(messageRepository.findByDialogAndClientMessageId).toHaveBeenCalledWith(
      'dialog-1',
      'tmp_abc123'
    )
    expect(messageRepository.create).not.toHaveBeenCalled()
    expect(fileStorage.uploadFile).not.toHaveBeenCalled()
    expect(publishSupportChatEvent).not.toHaveBeenCalled()
    expect(result.message.id).toBe('message-existing')
    expect(result.message.clientMessageId).toBe('tmp_abc123')
  })

  test('editMessage rejects when counterparty has already read message', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
    })
    ;(dbClient.chatMessage.findFirst as jest.Mock).mockResolvedValue({
      id: 'message-1',
      senderType: 'USER',
      senderUserId: 'user-1',
      senderStaffId: null,
      createdAt: new Date('2026-02-26T10:00:00.000Z'),
      deletedAt: null,
    })
    ;(dbClient.supportReadState.findFirst as jest.Mock).mockResolvedValue({
      id: 'read-state-1',
    })

    await expect(
      service.editMessage({
        actor: { id: 'user-1', role: 'USER' },
        dialogId: 'dialog-1',
        messageId: 'message-1',
        text: 'updated',
      })
    ).rejects.toMatchObject<Partial<SupportChatDomainError>>({
      code: 'MESSAGE_ALREADY_READ',
    })
  })

  test('deleteMessage soft deletes own unread message and publishes event', async () => {
    conversationRepository.findById.mockResolvedValue({
      id: 'dialog-1',
      userId: 'user-1',
    })
    ;(dbClient.chatMessage.findFirst as jest.Mock).mockResolvedValue({
      id: 'message-1',
      senderType: 'USER',
      senderUserId: 'user-1',
      senderStaffId: null,
      createdAt: new Date('2026-02-26T10:00:00.000Z'),
      deletedAt: null,
    })
    ;(dbClient.supportReadState.findFirst as jest.Mock).mockResolvedValue(null)
    attachmentRepository.listByMessage.mockResolvedValue([
      {
        id: 'attachment-1',
        originalName: 'file.png',
        storagePath: 'private/support-chat/user-1/file.png',
        mimeType: 'image/png',
        sizeBytes: 123,
      },
    ])
    ;(fileStorage.deleteByPath as jest.Mock).mockResolvedValue(undefined)
    attachmentRepository.deleteByIds.mockResolvedValue(1)
    ;(dbClient.chatMessage.update as jest.Mock).mockResolvedValue({
      id: 'message-1',
      dialogId: 'dialog-1',
      deletedAt: new Date('2026-02-26T11:00:00.000Z'),
      deletedBy: 'user-1',
    })

    const result = await service.deleteMessage({
      actor: { id: 'user-1', role: 'USER' },
      dialogId: 'dialog-1',
      messageId: 'message-1',
    })

    expect(dbClient.chatMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'message-1' },
      })
    )
    expect(attachmentRepository.listByMessage).toHaveBeenCalledWith({
      dialogId: 'dialog-1',
      messageId: 'message-1',
    })
    expect(fileStorage.deleteByPath).toHaveBeenCalledWith(
      'private/support-chat/user-1/file.png'
    )
    expect(attachmentRepository.deleteByIds).toHaveBeenCalledWith(['attachment-1'])
    expect(publishSupportChatEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'message.updated',
        dialogId: 'dialog-1',
        userId: 'user-1',
      })
    )
    expect(result.deletedBy).toBe('user-1')
  })

  test('getUnansweredDialogsCount for user uses aggregated query result', async () => {
    ;(dbClient.$queryRaw as jest.Mock).mockResolvedValue([{ count: 4n }])

    const result = await service.getUnansweredDialogsCount({
      actor: { id: 'user-1', role: 'USER' },
    })

    expect(dbClient.$queryRaw).toHaveBeenCalledTimes(1)
    expect(result.count).toBe(4)
  })

  test('getUnansweredDialogsCount for staff checks permission and uses aggregated query', async () => {
    ;(dbClient.staffPermission.findUnique as jest.Mock).mockResolvedValue({
      canManageSupportChats: true,
    })
    ;(dbClient.$queryRaw as jest.Mock).mockResolvedValue([{ count: 2n }])

    const result = await service.getUnansweredDialogsCount({
      actor: { id: 'staff-1', role: 'STAFF' },
    })

    expect(dbClient.staffPermission.findUnique).toHaveBeenCalledWith({
      where: { userId: 'staff-1' },
      select: { canManageSupportChats: true },
    })
    expect(dbClient.$queryRaw).toHaveBeenCalledTimes(1)
    expect(result.count).toBe(2)
  })
})
