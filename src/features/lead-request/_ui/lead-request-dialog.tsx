'use client'

import React from 'react'
import { toast } from 'sonner'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Checkbox } from '@/shared/ui/checkbox'
import { leadRequestApi } from '../_api'
import {
  leadRequestSchema,
  type LeadRequestInput,
} from '../_domain/lead-request-schema'

type LeadRequestDialogProps = {
  children?: React.ReactNode
  source?: string
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function LeadRequestDialog({
  children,
  source,
  title = 'Оставить заявку',
  description = 'Заполните форму, и мы свяжемся с вами в ближайшее время.',
  open: controlledOpen,
  onOpenChange,
}: Readonly<LeadRequestDialogProps>) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const dialogOpen = isControlled ? controlledOpen : internalOpen

  const submitLead = leadRequestApi.leadRequest.submit.useMutation()
  const form = useForm<LeadRequestInput>({
    resolver: zodResolver(leadRequestSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      country: '',
      hasTelegram: false,
      telegramContact: '',
      honey: '',
    },
  })

  const hasTelegram = form.watch('hasTelegram')
  const isSubmitting = form.formState.isSubmitting || submitLead.isPending

  const setDialogOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      form.reset()
    }
  }

  const handleSubmit = form.handleSubmit(async data => {
    const payload: LeadRequestInput = {
      ...data,
      source,
    }

    if (data.hasTelegram) {
      payload.telegramContact = data.telegramContact
    } else {
      payload.telegramContact = undefined
    }

    try {
      await submitLead.mutateAsync(payload)
      toast.success('Заявка отправлена')
      setDialogOpen(false)
    } catch {
      toast.error('Ошибка при отправке')
    }
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="lead-fullname">ФИО</Label>
            <Input
              id="lead-fullname"
              placeholder="Введите ФИО"
              aria-invalid={Boolean(form.formState.errors.fullName)}
              disabled={isSubmitting}
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone">Номер телефона</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="+7 900 000-00-00"
              aria-invalid={Boolean(form.formState.errors.phone)}
              disabled={isSubmitting}
              {...form.register('phone')}
            />
            {form.formState.errors.phone ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-country">Страна проживания</Label>
            <Input
              id="lead-country"
              placeholder="Например, Россия"
              aria-invalid={Boolean(form.formState.errors.country)}
              disabled={isSubmitting}
              {...form.register('country')}
            />
            {form.formState.errors.country ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.country.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="hasTelegram"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="lead-telegram"
                  checked={field.value}
                  onCheckedChange={checked => field.onChange(checked === true)}
                  disabled={isSubmitting}
                />
              )}
            />
            <Label htmlFor="lead-telegram">Есть Telegram</Label>
          </div>

          {hasTelegram ? (
            <div className="space-y-2">
              <Label htmlFor="lead-telegram-contact">
                Как вас найти в Telegram?
              </Label>
              <Input
                id="lead-telegram-contact"
                placeholder="@username или ссылка"
                aria-invalid={Boolean(form.formState.errors.telegramContact)}
                disabled={isSubmitting}
                {...form.register('telegramContact')}
              />
              {form.formState.errors.telegramContact ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.telegramContact.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="lead-company">Company</Label>
            <Input
              id="lead-company"
              tabIndex={-1}
              autoComplete="off"
              disabled={isSubmitting}
              {...form.register('honey')}
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={isSubmitting}
              >
                Назад
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="rounded-2xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
