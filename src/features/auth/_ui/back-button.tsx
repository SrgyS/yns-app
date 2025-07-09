import { Button } from '@/shared/ui/button'
import Link from 'next/link'

interface backButtonProps {
  href: string
  label: string
}
export const BackButton = ({ href, label }: backButtonProps) => {
  return (
    <Button asChild variant="link" className="flex items-center gap-2">
      <Link href={href}> {label}</Link>
    </Button>
  )
}
