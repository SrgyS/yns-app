'use client'

type Props = { videoId: string }

export function KinescopePlayer({ videoId }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="aspect-video">
        <iframe
          src={videoId}
          title="Kinescope video player"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 block h-full w-full border-0"
        />
      </div>
    </div>
  )
}
