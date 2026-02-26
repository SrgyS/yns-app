import { privateConfig } from '@/shared/config/private'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createId } from '@paralleldrive/cuid2'
import {
  StoredFile,
  StoredFileDownload,
  StoredFileStreamDownload,
  StorageAccessLevel,
} from '../types'

export class MinioStorage {
  private s3Client = new S3Client({
    forcePathStyle: true,
    endpoint: privateConfig.S3_ENDPOINT,
    region: privateConfig.S3_REGION,
    credentials: {
      accessKeyId: privateConfig.S3_ACCESS_KEY_ID,
      secretAccessKey: privateConfig.S3_SECRET_ACCESS_KEY,
    },
  })

  async uploadImage(file: File, tag: string, userId: string) {
    return this.upload(file, tag, userId, 'public')
  }

  async uploadFile(
    file: File,
    tag: string,
    userId: string,
    accessLevel: StorageAccessLevel = 'public'
  ) {
    return this.upload(file, tag, userId, accessLevel)
  }

  async downloadByPath(path: string): Promise<StoredFileDownload> {
    const [bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    if (!bucket || !key) {
      throw new Error('Invalid storage path')
    }

    const result = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    if (!result.Body) {
      throw new Error('Storage object body is empty')
    }

    const streamBody = result.Body as {
      transformToByteArray?: () => Promise<Uint8Array>
      arrayBuffer?: () => Promise<ArrayBuffer>
    }

    if (streamBody.transformToByteArray) {
      const body = await streamBody.transformToByteArray()
      return {
        body,
        contentType: result.ContentType ?? 'application/octet-stream',
      }
    }

    if (streamBody.arrayBuffer) {
      const buffer = await streamBody.arrayBuffer()
      return {
        body: new Uint8Array(buffer),
        contentType: result.ContentType ?? 'application/octet-stream',
      }
    }

    throw new Error('Storage body stream cannot be converted to bytes')
  }

  async downloadStreamByPath(path: string): Promise<StoredFileStreamDownload> {
    const [bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    if (!bucket || !key) {
      throw new Error('Invalid storage path')
    }

    const result = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    if (!result.Body) {
      throw new Error('Storage object body is empty')
    }

    const streamBody = result.Body as {
      transformToWebStream?: () => ReadableStream<Uint8Array>
      transformToByteArray?: () => Promise<Uint8Array>
      arrayBuffer?: () => Promise<ArrayBuffer>
    }

    if (streamBody.transformToWebStream) {
      return {
        body: streamBody.transformToWebStream(),
        contentType: result.ContentType ?? 'application/octet-stream',
        contentLength: result.ContentLength,
        eTag: result.ETag,
        lastModified: result.LastModified,
      }
    }

    if (streamBody.transformToByteArray) {
      const byteArray = await streamBody.transformToByteArray()
      const normalizedByteArray = Uint8Array.from(byteArray)

      return {
        body: new Blob([normalizedByteArray]).stream() as ReadableStream<Uint8Array>,
        contentType: result.ContentType ?? 'application/octet-stream',
        contentLength: result.ContentLength,
        eTag: result.ETag,
        lastModified: result.LastModified,
      }
    }

    if (streamBody.arrayBuffer) {
      const buffer = await streamBody.arrayBuffer()

      return {
        body: new Blob([buffer]).stream() as ReadableStream<Uint8Array>,
        contentType: result.ContentType ?? 'application/octet-stream',
        contentLength: result.ContentLength,
        eTag: result.ETag,
        lastModified: result.LastModified,
      }
    }

    throw new Error('Storage body stream cannot be converted to web stream')
  }

  async deleteByPath(path: string): Promise<void> {
    const [bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    if (!bucket || !key) {
      throw new Error('Invalid storage path')
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
  }

  async upload(
    file: File,
    tag: string,
    userId: string,
    accessLevel: StorageAccessLevel
  ): Promise<StoredFile> {
    const bucket = this.resolveBucket(accessLevel)
    const key = `${tag}/${userId}/${Date.now().toString()}-${file.name}`
    const contentType =
      file.type && file.type !== 'application/octet-stream'
        ? file.type
        : file.name.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : 'application/octet-stream'

    const res = await new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        ...(accessLevel === 'public' ? { ACL: 'public-read' } : {}),
      },
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    }).done()

    return {
      id: createId(),
      name: file.name,
      type: file.type,
      path: `${bucket}/${key}`,
      prefix: '/storage',
      eTag: res.ETag,
    }
  }

  private resolveBucket(accessLevel: StorageAccessLevel) {
    const deprecatedBucket = privateConfig.S3_IMAGES_BUCKET
    if (accessLevel === 'private') {
      const privateBucket = privateConfig.S3_PRIVATE_BUCKET ?? deprecatedBucket
      if (privateBucket) {
        return privateBucket
      }
    }

    const publicBucket = privateConfig.S3_PUBLIC_BUCKET ?? deprecatedBucket
    if (publicBucket) {
      return publicBucket
    }

    throw new Error('S3 bucket is not configured')
  }
}
