'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Profile, profileSchema } from '@/entity/user/client'
import { useUpdateProfile } from '../_vm/use-update-profile'
import { AvatarField } from './avatar-field'
import { UserId } from '@/kernel/domain/user'
import { SmallSpinner } from '@/shared/ui/small-spinner'

const profileFormSchema = profileSchema.partial()

// Явно задаём тип значений формы, чтобы избежать вывода unknown в name
type ProfileFormValues = Partial<Profile>

const getDefaultValues = (profile: Profile) => ({
  email: profile.email,
  image: profile.image ?? undefined,
  // Нормализуем значение так же, как серверная схема (trim)
  name: (profile.name ?? '').trim(),
})

export function ProfileForm({
  onSuccess,
  submitText = 'Сохранить',
  profile,
  userId,
}: {
  userId: UserId
  profile: Profile
  onSuccess?: () => void
  submitText?: string
}) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: getDefaultValues(profile),
  })

  const updateProfile = useUpdateProfile()

  const handleSubmit = form.handleSubmit(async data => {
    await updateProfile.update({
      userId,
      data,
    })
    onSuccess?.()
  })

  const email = form.watch('email')
  const name = form.watch('name')

  const isSubmitting = updateProfile.isPending

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem className="justify-items-center items-center">
              <FormLabel>Изображение профиля</FormLabel>
              <FormControl>
                <div className="relative">
                  <AvatarField
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    name={name ?? undefined}
                    email={email ?? ''}
                    disabled={isSubmitting}
                  />
                  <div className="absolute bottom-1 right-1 translate-x-1/4 translate-y-1/4 rounded-full border bg-background p-1 shadow">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя пользователя</FormLabel>
              <FormControl>
                <Input
                  placeholder=""
                  {...field}
                  value={field.value ?? ''}
                  onBlur={e => {
                    // Устраняем ложное dirty: триммим значение на блюре
                    const trimmed = e.target.value.trim()
                    if (trimmed !== field.value) {
                      field.onChange(trimmed)
                    }
                    field.onBlur()
                  }}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isDirty || isSubmitting}
        >
          <SmallSpinner isLoading={isSubmitting} />
          {isSubmitting && <span className="mr-2">Сохраняем…</span>}
          {submitText}
        </Button>
      </form>
    </Form>
  )
}
