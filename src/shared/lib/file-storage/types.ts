export type StoredFile = {
  id: string
  name: string
  path: string
  prefix: string
  type: string
  eTag?: string
}

export type StoredFileDownload = {
  body: Uint8Array
  contentType: string
}

export type StoredFileStreamDownload = {
  body: ReadableStream<Uint8Array>
  contentType: string
  contentLength?: number
  eTag?: string
  lastModified?: Date
}

export type StorageAccessLevel = 'public' | 'private'
