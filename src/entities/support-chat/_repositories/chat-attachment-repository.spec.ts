jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    chatAttachment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import { dbClient } from '@/shared/lib/db'
import { ChatAttachmentRepository } from './chat-attachment-repository'

describe('ChatAttachmentRepository cleanup methods', () => {
  const repository = new ChatAttachmentRepository()

  beforeEach(() => {
    ;(dbClient.chatAttachment.findMany as jest.Mock).mockReset()
    ;(dbClient.chatAttachment.deleteMany as jest.Mock).mockReset()
    ;(dbClient.chatAttachment.updateMany as jest.Mock).mockReset()
  })

  test('listStaleUploaded filters only unlinked cleanup candidates', async () => {
    ;(dbClient.chatAttachment.findMany as jest.Mock).mockResolvedValue([])

    await repository.listStaleUploaded(new Date('2026-03-06T00:00:00.000Z'), 50)

    expect(dbClient.chatAttachment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          messageId: null,
          OR: [{ status: 'UPLOADED' }, { status: 'LINKED' }],
          createdAt: expect.any(Object),
        }),
        take: 50,
      })
    )
  })

  test('deleteUnlinkedUploadedByIds applies status/message guard', async () => {
    ;(dbClient.chatAttachment.deleteMany as jest.Mock).mockResolvedValue({
      count: 2,
    })

    const deleted = await repository.deleteUnlinkedUploadedByIds([
      'att-1',
      'att-2',
    ])

    expect(deleted).toBe(2)
    expect(dbClient.chatAttachment.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['att-1', 'att-2'],
        },
        status: 'UPLOADED',
        messageId: null,
      },
    })
  })

  test('claimUploadedForCleanup marks uploaded row as cleanup-claimed', async () => {
    ;(dbClient.chatAttachment.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    })

    const claimed = await repository.claimUploadedForCleanup('att-1')

    expect(claimed).toBe(true)
    expect(dbClient.chatAttachment.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'att-1',
        status: 'UPLOADED',
        messageId: null,
      },
      data: {
        status: 'LINKED',
      },
    })
  })

  test('restoreCleanupClaim reverts only cleanup marker rows', async () => {
    ;(dbClient.chatAttachment.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    })

    await repository.restoreCleanupClaim('att-2')

    expect(dbClient.chatAttachment.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'att-2',
        status: 'LINKED',
        messageId: null,
      },
      data: {
        status: 'UPLOADED',
      },
    })
  })

  test('deleteCleanupClaimedById deletes only claimed cleanup rows', async () => {
    ;(dbClient.chatAttachment.deleteMany as jest.Mock).mockResolvedValue({
      count: 1,
    })

    const deleted = await repository.deleteCleanupClaimedById('att-3')

    expect(deleted).toBe(1)
    expect(dbClient.chatAttachment.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'att-3',
        status: 'LINKED',
        messageId: null,
      },
    })
  })
})
