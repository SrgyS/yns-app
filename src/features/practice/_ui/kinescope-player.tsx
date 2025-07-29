'use client'

export function KinescopePlayer({ videoId }: { videoId: string }) {
  return (
    <div className="relative pt-[56.25%] w-full">
      <iframe
        src={videoId}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;"
        frameBorder="0"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-lg"
      />
    </div>
  )
}
