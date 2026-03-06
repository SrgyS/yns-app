# Tech Task --- Fix Oversized Video Crash in Support Chat

## Goal

Eliminate browser crashes when users attach large video files (e.g.,
oversized mp4) in `support-chat`.

The current implementation converts attachments to base64 before
sending, stores them in optimistic state, and renders previews via
`data:` URLs. For large videos this causes extreme memory usage and can
crash the Chrome renderer before the network request is sent.

Goals: - prevent browser crashes - add safe client-side validation -
remove heavy base64 usage for large attachments - preserve all existing
chat functionality (SSE, optimistic messages, attachments, read/unread
state)

------------------------------------------------------------------------

# Current Problem

### Observed behavior

When attaching a large mp4 and clicking **Send**:

-   No network request appears in DevTools.
-   The page crashes with Chrome error "Aw, Snap! code 5".
-   Browser suggests page reload.

### Root cause

Current flow:

File -\> FileReader -\> base64 conversion -\> optimistic message state
-\> rendered as `<video src="data:...">`{=html} -\> mutation
sendMessage()

This creates multiple memory-heavy copies:

-   File Blob
-   base64 string (\~33% larger)
-   optimistic state copy
-   React props copy
-   browser video decoder buffer

Large mp4 files can cause renderer memory exhaustion and crash the tab.

------------------------------------------------------------------------

# Requirements

## 1. Client-side file validation (before FileReader)

Validate files immediately after selection.

Rules:

MAX_ATTACHMENT_SIZE = 25MB\
ALLOWED_TYPES = image/\*, video/mp4, video/webm

Behavior if file exceeds limit:

-   Do NOT read the file
-   Do NOT create base64
-   Do NOT add to optimistic message
-   Show UI error message

Example:

Файл превышает допустимый размер (25MB)

------------------------------------------------------------------------

# 2. Remove base64 usage for video attachments

Current (unsafe):

File -\> base64 -\> data:video/mp4 -\> `<video src="data:...">`{=html}

Required:

File -\> objectURL -\> `<video src={objectURL}>`{=html}

Implementation:

const previewUrl = URL.createObjectURL(file)

Cleanup:

URL.revokeObjectURL(previewUrl)

when attachment removed or component unmounted.

------------------------------------------------------------------------

# 3. Disable inline video preview for large files

Rendering `<video>` for large pending uploads can trigger heavy
decoding.

Rule:

If file size \> 10MB\
Do NOT render `<video>` preview.

Instead render file card:

\[video icon\] filename.mp4 12.4 MB

------------------------------------------------------------------------

# 4. Lightweight optimistic message state

Optimistic messages must NOT contain binary payloads.

Current (problem):

optimisticMessage.attachments = \[ { base64: "...huge..." }\]

Required:

optimisticMessage.attachments = \[ { id: localId, name: file.name, size:
file.size, mimeType: file.type, previewUrl?: objectURL, status:
"pending" }\]

No base64 allowed.

------------------------------------------------------------------------

# 5. Attachment upload flow (recommended)

Current:

encode base64 -\> send message

Target architecture:

1.  create optimistic message (clientMessageId)
2.  upload attachment to storage
3.  send message with attachment metadata
4.  server stores attachment references
5.  SSE confirms message

------------------------------------------------------------------------

# 6. Message sending state (Telegram-like)

Messages should track sending state:

pending\
sending\
sent\
failed

Retry must reuse clientMessageId.

------------------------------------------------------------------------

# 7. Prevent crashes from large video previews

Guard video preview rendering:

if (attachment.size \> 10MB) { renderFileCard() } else {
renderVideoPreview() }

------------------------------------------------------------------------

# UI behavior

### Oversized file

User selects file \> 25MB

Result:

Toast: Файл слишком большой (максимум 25MB)

File is not added.

------------------------------------------------------------------------

### Large but allowed video (10--25MB)

Render file card preview (no inline player).

------------------------------------------------------------------------

### Small video (\<10MB)

Render normal video preview.

------------------------------------------------------------------------

# Non‑Goals

-   No change to chat business logic
-   No change to SSE architecture
-   No change to read/unread behavior
-   No redesign of attachment UI

------------------------------------------------------------------------

# Definition of Done

-   Uploading a large mp4 never crashes the tab
-   Files \> 25MB blocked client‑side
-   No base64 encoding for videos
-   Optimistic messages contain no binary payloads
-   `<video src="data:...">` removed
-   Large video preview disabled
-   Existing support-chat functionality preserved

------------------------------------------------------------------------

# Validation Steps

1.  Attach 30MB mp4

Expected: - Client error - No crash - No network request

2.  Attach 20MB mp4

Expected: - File card preview - Message sends successfully

3.  Attach 5MB mp4

Expected: - Video preview renders - Message sends

4.  Attach image

Expected: - Image preview works as before

------------------------------------------------------------------------

# Recommended future improvement

Implement direct upload to storage via presigned URL.

client -\> storage upload\
client -\> sendMessage(metadata)

Benefits:

-   minimal payload size
-   better scalability
-   safer optimistic UI
