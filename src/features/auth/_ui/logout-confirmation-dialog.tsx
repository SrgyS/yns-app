'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  email: string
}

export function LogoutConfirmationDialog({
  isOpen,
  onOpenChange,
  email,
}: LogoutConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Ошибка при выходе:', error)
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Вы точно хотите выйти?
          </DialogTitle>
          <DialogDescription>{email}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 flex flex-col sm:flex-col">
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isLoading ? 'Выход...' : 'Выйти'}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
