type SupportChatAttachmentInput = {
  filename: string
  mimeType: string
  sizeBytes: number
  base64: string
}

export async function toSupportChatAttachments(
  files: File[]
): Promise<SupportChatAttachmentInput[] | undefined> {
  if (files.length === 0) {
    return undefined
  }

  const mapped = await Promise.all(
    files.map(async file => ({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      base64: await fileToBase64(file),
    }))
  )

  return mapped
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
        return
      }

      reject(new Error('Не удалось обработать файл'))
    }

    reader.onerror = () => {
      reject(new Error('Не удалось обработать файл'))
    }

    reader.readAsDataURL(file)
  })
}
