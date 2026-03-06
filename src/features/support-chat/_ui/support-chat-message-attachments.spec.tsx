import { render, screen } from '@testing-library/react'

import { SupportChatMessageAttachments } from './support-chat-message-attachments'

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
})
