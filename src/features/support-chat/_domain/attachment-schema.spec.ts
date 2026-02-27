import {
  parseStoredSupportChatAttachments,
  storedSupportChatAttachmentSchema,
} from './attachment-schema'

describe('support chat attachment schema', () => {
  test('parses stored attachments array', () => {
    const input = [
      {
        id: 'att-1',
        name: 'file.pdf',
        path: 'bucket/user/support-chat-file.pdf',
        type: 'application/pdf',
        sizeBytes: 1024,
      },
    ]

    const parsed = parseStoredSupportChatAttachments(input)

    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toEqual(input[0])
  })

  test('returns empty array for invalid payload', () => {
    const parsed = parseStoredSupportChatAttachments({
      id: 'att-1',
      invalid: true,
    })

    expect(parsed).toEqual([])
  })

  test('stored attachment schema rejects zero size', () => {
    const parsed = storedSupportChatAttachmentSchema.safeParse({
      id: 'att-1',
      name: 'bad.txt',
      path: 'bucket/user/bad.txt',
      type: 'text/plain',
      sizeBytes: 0,
    })

    expect(parsed.success).toBe(false)
  })
})
