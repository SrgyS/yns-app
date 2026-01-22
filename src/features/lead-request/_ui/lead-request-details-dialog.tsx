'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { LeadRequestDialog } from './lead-request-dialog'
import { Button } from '@/shared/ui/button'

type LeadRequestDetailsDialogProps = {
  title: string
  description: string
  source: string
  trigger?: React.ReactNode
}

export function LeadRequestDetailsDialog({
  title,
  description,
  source,
  trigger,
}: Readonly<LeadRequestDetailsDialogProps>) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)

  return (
    <>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" className="rounded-2xl">
              Подробнее
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl">
                Назад
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="rounded-2xl"
              onClick={() => {
                setDetailsOpen(false)
                setLeadOpen(true)
              }}
            >
              Оставить заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadRequestDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        source={source}
      />
    </>
  )
}
