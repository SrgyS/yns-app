import { resolveStorageUrl } from '@/shared/lib/images'
import Image, { type ImageProps } from 'next/image'

type Props = ImageProps

export function AppImage({ src, alt, unoptimized, ...rest }: Props) {
  const isStoragePath = typeof src === 'string' && src.startsWith('/storage/')

  // Если не передан unoptimized явно,
  // форсируем его для локальных путей /storage/,
  // чтобы Next.js не пытался их оптимизировать через свой сервер
  // (это актуально если у нас нет rewrite, но с rewrite тоже полезно для консистентности)
  // В продакшене resolveStorageUrl вернет полный URL, и next/image будет оптимизировать его как remote image
  const shouldUnoptimize = unoptimized ?? isStoragePath

  const resolvedSrc = typeof src === 'string' ? resolveStorageUrl(src) : src

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      unoptimized={shouldUnoptimize}
      {...rest}
    />
  )
}
