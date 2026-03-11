'use client'

import { useSyncExternalStore } from 'react'
import {
  getNavigationFeedbackSnapshot,
  subscribeNavigationFeedback,
} from '@/shared/lib/navigation/navigation-feedback'
import { cn } from '@/shared/ui/utils'

export function TopProgressBar() {
  const snapshot = useSyncExternalStore(
    subscribeNavigationFeedback,
    getNavigationFeedbackSnapshot,
    getNavigationFeedbackSnapshot
  )

  const isVisible = snapshot.visible || snapshot.completing

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-200 h-1 opacity-0 transition-opacity duration-150',
        isVisible && 'opacity-100'
      )}
    >
      <div className="relative h-full overflow-hidden bg-transparent">
        <div
          className="h-full origin-left bg-linear-to-r from-primary via-primary/85 to-primary/60 transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${snapshot.progress})`,
          }}
        />
      </div>
    </div>
  )
}
