'use client'

import { createContext, useContext } from 'react'

type AccessesTableContextValue = {
  canEditAccess: boolean
  isClosing: boolean
  closingAccessId?: string
  onClose(accessId: string): void
}

const AccessesTableContext =
  createContext<AccessesTableContextValue | undefined>(undefined)

export function useAccessesTableContext() {
  const context = useContext(AccessesTableContext)
  if (!context) {
    throw new Error('AccessesTableContext is not provided')
  }
  return context
}

export { AccessesTableContext }
