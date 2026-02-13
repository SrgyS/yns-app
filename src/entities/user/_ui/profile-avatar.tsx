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
  const imageSrc = profile.image

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={imageSrc ?? undefined} className="object-cover" />
      <AvatarFallback>{getProfileLetters(profile)}</AvatarFallback>
    </Avatar>
  )
}
