import {
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../_domain/attachment-schema'
import {
  revokePendingSupportChatAttachmentPreviews,
  toPendingSupportChatAttachments,
  toSupportChatAttachments,
} from './support-chat-attachments-upload'

const createFile = (input: {
  name: string
  type: string
  sizeBytes: number
}) => {
  const unitSize = Math.max(1, Math.min(1024, input.sizeBytes))
  const chunks = Math.ceil(input.sizeBytes / unitSize)
  const chunk = new Uint8Array(unitSize)
  const blobParts = Array.from({ length: chunks }, () => chunk)

  return new File(blobParts, input.name, { type: input.type })
}

describe('support-chat-attachments-upload', () => {
  const fetchMock = jest.fn()
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL

  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
    URL.createObjectURL = jest.fn()
    URL.revokeObjectURL = jest.fn()
  })

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectUrl
    URL.revokeObjectURL = originalRevokeObjectUrl
  })

  test('rejects oversized files before upload request', async () => {
    const tooLargeFile = createFile({
      name: 'big-video.mp4',
      type: 'video/mp4',
      sizeBytes: MAX_ATTACHMENT_SIZE_BYTES + 1,
    })

    await expect(
      toSupportChatAttachments({
        files: [tooLargeFile],
        dialogId: 'dialog-1',
      })
    ).rejects.toThrow('ATTACHMENT_TOO_LARGE')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('uploads files and returns attachment refs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        attachment: {
          attachmentId: 'att-1',
          dialogId: 'dialog-1',
          name: 'pic.png',
          mimeType: 'image/png',
          sizeBytes: 128,
        },
      }),
    })

    const file = createFile({
      name: 'pic.png',
      type: 'image/png',
      sizeBytes: 128,
    })

    const result = await toSupportChatAttachments({
      files: [file],
      dialogId: 'dialog-1',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      {
        attachmentId: 'att-1',
        dialogId: 'dialog-1',
        name: 'pic.png',
        mimeType: 'image/png',
        sizeBytes: 128,
      },
    ])
  })

  test('pending attachments include object URL only for image/video and can be revoked', () => {
    const createObjectUrlSpy = URL.createObjectURL as jest.Mock
    const revokeObjectUrlSpy = URL.revokeObjectURL as jest.Mock
    createObjectUrlSpy.mockReturnValueOnce('blob:image-preview')

    const imageFile = createFile({
      name: 'photo.jpg',
      type: 'image/jpeg',
      sizeBytes: 256,
    })
    const textFile = createFile({
      name: 'notes.txt',
      type: 'text/plain',
      sizeBytes: 64,
    })

    const pendingAttachments = toPendingSupportChatAttachments(
      [imageFile, textFile],
      [
        {
          attachmentId: 'att-img',
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 256,
        },
        {
          attachmentId: 'att-txt',
          name: 'notes.txt',
          mimeType: 'text/plain',
          sizeBytes: 64,
        },
      ]
    )

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1)
    expect(pendingAttachments[0]?.previewUrl).toBe('blob:image-preview')
    expect(pendingAttachments[1]?.previewUrl).toBeUndefined()

    revokePendingSupportChatAttachmentPreviews(pendingAttachments)

    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:image-preview')

  })
})
