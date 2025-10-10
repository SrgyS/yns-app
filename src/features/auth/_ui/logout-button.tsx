'use client'

import { Button } from '@/shared/ui/button'
import { ChevronRight, LogOut } from 'lucide-react'
import { LogoutConfirmationDialog } from '@/features/auth/_ui/logout-confirmation-dialog'
import { useState } from 'react'

export function LogoutButton({ email }: { email: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleLogoutClick = () => {
    setIsDialogOpen(true)
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={handleLogoutClick}
      >
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Выйти из системы
        </div>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <LogoutConfirmationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        email={email}
      />
    </>
  )
}