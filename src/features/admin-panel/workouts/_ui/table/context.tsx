import { createContext, useContext } from 'react'

export type AdminWorkoutRow = {
  id: string
  videoId: string
  title: string
  durationSec: number
  section: string
  difficulty: string
  posterUrl?: string | null
  needsReview: boolean
  manuallyEdited: boolean
  createdAt: string
}

type ContextValue = {
  onEdit: (workout: AdminWorkoutRow) => void
}

const WorkoutTableContext = createContext<ContextValue | null>(null)

export const WorkoutTableContextProvider = WorkoutTableContext.Provider

export const useWorkoutTableContext = () => {
  const ctx = useContext(WorkoutTableContext)
  if (!ctx) {
    throw new Error('useWorkoutTableContext must be used within provider')
  }
  return ctx
}
