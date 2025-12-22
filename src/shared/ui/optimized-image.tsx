import Image, { type ImageProps } from 'next/image'

type Props = ImageProps

export function OptimizedImage({ src, alt, ...rest }: Props) {
  const isStoragePath = typeof src === 'string' && src.startsWith('/storage/')

  return <Image src={src} alt={alt} unoptimized={isStoragePath} {...rest} />
}
