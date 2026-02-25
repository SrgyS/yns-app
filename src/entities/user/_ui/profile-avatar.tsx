import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Profile } from '../_domain/types'
import { cn } from '@/shared/ui/utils'
import { getProfileLetters } from '../_vm/get-profile-letters'

export const ProfileAvatar = ({
  profile,
  className,
}: {
  profile?: Profile
  className?: string
}) => {
  if (!profile) {
    return null
  }

  return (
    <Avatar className={cn(className)}>
      {/*
       * AvatarImage внутри вызывает resolveStorageUrl для нормализации пути:
       * storage-пути (/storage/...) превращаются в полный URL через IMAGE_BASE_URL,
       * а внешние URL (https://...) и OAuth-аватары передаются как есть.
       * При рефакторинге avatar.tsx это поведение необходимо сохранить.
       */}
      <AvatarImage src={profile.image ?? undefined} className="object-cover" />
      <AvatarFallback>{getProfileLetters(profile)}</AvatarFallback>
    </Avatar>
  )
}

