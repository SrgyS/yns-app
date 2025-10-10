'use client'

import * as React from 'react'
import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export function ToggleTheme() {
  const { setTheme, resolvedTheme, theme } = useTheme()

  const toggleTheme = useCallback(() => {
    const current = (resolvedTheme ?? theme) as 'light' | 'dark' | undefined
    setTheme(current === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, theme, setTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Переключатель темы"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  )
}
