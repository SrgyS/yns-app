'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

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
import { Profile } from '@/entity/user/client'

import { useUpdateProfile } from '../_vm/use-update-profile'
import { AvatarField } from './avatar-field'
import { UserId } from '@/kernel/domain/user'
import { SmallSpinner } from '@/shared/ui/small-spinner'

const profileFormSchema = z.object({
  name: z
    .string()
    .max(30, {
      message: 'Длина имени пользователя не должна превышать 30 символов',
    })
    .transform(name => name.trim())
    .optional(),
  email: z.string().email().optional(),
  image: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const getDefaultValues = (profile: Profile) => ({
  email: profile.email,
  image: profile.image ?? undefined,
  name: profile.name ?? '',
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
    const newProfile = await updateProfile.update({
      userId,
      data,
    })

    form.reset(getDefaultValues(newProfile))
    onSuccess?.()
  })

  const email = form.watch('email')
  const name = form.watch('name')

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
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
                <Input placeholder="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          //   disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>Аватарка</FormLabel>
              <FormControl>
                <AvatarField
                  value={field.value}
                  onChange={field.onChange}
                  name={name}
                  email={email ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          <SmallSpinner isLoading={updateProfile.isPending} />
          {submitText}
        </Button>
      </form>
    </Form>
  )
}
