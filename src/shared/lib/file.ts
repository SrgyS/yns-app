export function selectFile(contentType: string, multiple: true): Promise<File[] | null>
export function selectFile(contentType: string): Promise<File | null>
export function selectFile(contentType: string, multiple?: boolean) {
  return new Promise<File | File[] | null>(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple ?? false
    input.accept = contentType

    input.onchange = () => {
      const files = Array.from(input.files as Iterable<File>)
      if (multiple) resolve(files.length ? files : null)
      else resolve(files[0] ?? null)
    }

    input.click()
  })
}

export function validateFileSize(file: File, sizeMb: number) {
  const fileSize = file.size / 1024 / 1024
  return fileSize <= sizeMb
}
