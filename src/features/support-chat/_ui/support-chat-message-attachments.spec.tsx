import { render, screen } from '@testing-library/react'

import { SupportChatMessageAttachments } from './support-chat-message-attachments'
import { MAX_ATTACHMENTS_PER_MESSAGE } from '../_domain/attachment-schema'

jest.mock('next/image', () => {
  return function MockNextImage(props: { alt?: string; src?: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ''} src={props.src} />
  }
})

describe('SupportChatMessageAttachments', () => {
  test('renders large video as file card without inline player', () => {
    const attachments = [
      {
        id: 'att-video-large',
        name: 'big.mp4',
        path: 'private/support-chat/big.mp4',
        type: 'video/mp4',
        sizeBytes: 11 * 1024 * 1024,
      },
    ]

    const { container } = render(
      <SupportChatMessageAttachments
        dialogId="dialog-1"
        attachments={attachments}
        isOutgoing={false}
      />
    )

    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByText('big.mp4')).toBeInTheDocument()
  })

  test('renders small video as inline player', () => {
    const attachments = [
      {
        id: 'att-video-small',
        name: 'small.mp4',
        path: 'private/support-chat/small.mp4',
        type: 'video/mp4',
        sizeBytes: 2 * 1024 * 1024,
      },
    ]

    const { container } = render(
      <SupportChatMessageAttachments
        dialogId="dialog-1"
        attachments={attachments}
        isOutgoing={true}
      />
    )

    expect(container.querySelector('video')).toBeInTheDocument()
  })

  test('renders image previews up to MAX_ATTACHMENTS_PER_MESSAGE', () => {
    const attachments = Array.from(
      { length: MAX_ATTACHMENTS_PER_MESSAGE + 1 },
      (_, index) => ({
        id: `att-image-${index}`,
        name: `image-${index}.png`,
        path: `private/support-chat/image-${index}.png`,
        type: 'image/png',
        sizeBytes: 100_000,
      })
    )

    render(
      <SupportChatMessageAttachments
        dialogId="dialog-1"
        attachments={attachments}
        isOutgoing={false}
      />
    )

    expect(screen.getAllByRole('img')).toHaveLength(MAX_ATTACHMENTS_PER_MESSAGE)
  })
})
