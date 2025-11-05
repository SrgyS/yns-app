'use client'

import { createContext, useContext } from 'react'
import type { PaidAccessState } from './paid-access-types'

const PaidAccessContext = createContext<PaidAccessState | null>(null)

export const PaidAccessProvider = ({
  value,
  children,
}: {
  value: PaidAccessState
  children: React.ReactNode
}) => (
  <PaidAccessContext.Provider value={value}>
    {children}
  </PaidAccessContext.Provider>
)

export const usePaidAccess = () => useContext(PaidAccessContext)
