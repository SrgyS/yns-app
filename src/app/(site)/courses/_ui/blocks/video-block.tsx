'use client'

import React from 'react'
import { VideoBlock } from '@/kernel/domain/course-page'
import { KinescopePlayer } from '@/features/daily-plan/_ui/kinescope-player'

export function VideoBlockComponent({ title, videoId }: VideoBlock) {
  return (
    <section className="space-y-6 py-8">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div className="mx-auto max-w-4xl">
        <KinescopePlayer
          videoId={videoId}
          className="rounded-xl overflow-hidden"
          options={{
            size: {
              width: '100%',
              height: 480,
            },
          }}
        />
      </div>
    </section>
  )
}
