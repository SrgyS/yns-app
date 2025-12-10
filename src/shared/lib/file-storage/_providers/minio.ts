import { privateConfig } from '@/shared/config/private'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createId } from '@paralleldrive/cuid2'
import { StoredFile } from '../types'

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
    return this.upload(file, privateConfig.S3_IMAGES_BUCKET, tag, userId)
  }

  async uploadFile(file: File, tag: string, userId: string) {
    // Reusing the same bucket for now, but potentially different tag/prefix
    return this.upload(file, privateConfig.S3_IMAGES_BUCKET, tag, userId)
  }

  async upload(
    file: File,
    bucket: string,
    tag: string,
    userId: string
  ): Promise<StoredFile> {
    const contentType =
      file.type && file.type !== 'application/octet-stream'
        ? file.type
        : file.name.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : 'application/octet-stream'

    const res = await new Upload({
      client: this.s3Client,
      params: {
        ACL: 'public-read',
        Bucket: bucket,
        Key: `${userId}/${tag}-${Date.now().toString()}-${file.name}`,
        Body: file,
        ContentType: contentType,
      },
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    }).done()

    return {
      id: createId(),
      name: file.name,
      type: file.type,
      path: `/storage/${bucket}/${res.Key}`,
      prefix: '/storage',
      eTag: res.ETag,
    }
  }
}
