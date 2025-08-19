'use client'

import { useState, useCallback } from 'react'
import KinescopePlayer from '@kinescope/react-kinescope-player'

type Props = {
  videoId: string
  onCompleted?: () => void
}

export const Player = ({ videoId, onCompleted }: Props) => {
  const [isCompleted, setIsCompleted] = useState(false)


  // Оптимизируем обработчики событий
  const handleEnded = useCallback(() => {
    if (!isCompleted) {
      setIsCompleted(true)
      onCompleted?.()
    }
  }, [isCompleted, onCompleted])

  const handleProgress = useCallback(
    (progressData: { bufferedTime: number; duration: number }) => {
      const { bufferedTime, duration } = progressData
      if (duration > 0 && !isCompleted) {
        const progressPercent = (bufferedTime / duration) * 100
        if (progressPercent >= 97) {
          setIsCompleted(true)
          onCompleted?.()
        }
      }
    },
    [isCompleted, onCompleted]
  )

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="aspect-video">
        <KinescopePlayer
          videoId={videoId}
          title="Kinescope video player"
          onEnded={handleEnded}
          onProgress={handleProgress}
        />
      </div>
    </div>
  )
}
