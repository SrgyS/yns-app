import { SupportChatReadService } from './support-chat-read-service'

jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    supportMessage: {
      findFirst: jest.fn(),
    },
  },
}))

import { dbClient } from '@/shared/lib/db'

describe('SupportChatReadService', () => {
  const readStateRepository = {
    findByDialogAndReader: jest.fn(),
    countUnreadForUser: jest.fn(),
    countUnreadForStaff: jest.fn(),
  }

  const service = new SupportChatReadService(readStateRepository as any)

  beforeEach(() => {
    readStateRepository.findByDialogAndReader.mockReset()
    readStateRepository.countUnreadForUser.mockReset()
    readStateRepository.countUnreadForStaff.mockReset()
    ;(dbClient.supportMessage.findFirst as jest.Mock).mockReset()
  })

  test('countUnreadForUser uses null readAt when state is missing', async () => {
    readStateRepository.findByDialogAndReader.mockResolvedValue(null)
    readStateRepository.countUnreadForUser.mockResolvedValue(3)

    const unread = await service.countUnreadForUser('dialog-1', 'user-1')

    expect(readStateRepository.countUnreadForUser).toHaveBeenCalledWith(
      'dialog-1',
      null,
      dbClient
    )
    expect(unread).toBe(3)
  })

  test('countUnreadForStaff uses readAt from read state', async () => {
    const readAt = new Date('2026-02-24T10:00:00.000Z')
    readStateRepository.findByDialogAndReader.mockResolvedValue({ readAt })
    readStateRepository.countUnreadForStaff.mockResolvedValue(1)

    const unread = await service.countUnreadForStaff('dialog-1', 'staff-1')

    expect(readStateRepository.countUnreadForStaff).toHaveBeenCalledWith(
      'dialog-1',
      readAt,
      dbClient
    )
    expect(unread).toBe(1)
  })

  test('hasUnansweredIncoming returns false when there is no user message', async () => {
    ;(dbClient.supportMessage.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ createdAt: new Date('2026-02-24T10:00:00.000Z') })

    const result = await service.hasUnansweredIncoming('dialog-1')

    expect(result).toBe(false)
  })

  test('hasUnansweredIncoming returns true when latest user message is newer', async () => {
    ;(dbClient.supportMessage.findFirst as jest.Mock)
      .mockResolvedValueOnce({ createdAt: new Date('2026-02-24T11:00:00.000Z') })
      .mockResolvedValueOnce({ createdAt: new Date('2026-02-24T10:00:00.000Z') })

    const result = await service.hasUnansweredIncoming('dialog-1')

    expect(result).toBe(true)
  })

  test('hasUnansweredIncoming returns false when staff message is newer', async () => {
    ;(dbClient.supportMessage.findFirst as jest.Mock)
      .mockResolvedValueOnce({ createdAt: new Date('2026-02-24T10:00:00.000Z') })
      .mockResolvedValueOnce({ createdAt: new Date('2026-02-24T11:00:00.000Z') })

    const result = await service.hasUnansweredIncoming('dialog-1')

    expect(result).toBe(false)
  })
})
