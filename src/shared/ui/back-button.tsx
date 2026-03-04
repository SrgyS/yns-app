import Link from 'next/link'
import { type ComponentProps } from 'react'
import { ArrowLeft } from 'lucide-react'
import { type VariantProps } from 'class-variance-authority'

import { Button, buttonVariants } from '@/shared/ui/button'

type BackButtonVariant = VariantProps<typeof buttonVariants>['variant']
type BackButtonSize = VariantProps<typeof buttonVariants>['size']

type BackButtonProps = {
  label?: string
  href?: string
  onClick?: ComponentProps<'button'>['onClick']
  variant?: BackButtonVariant
  size?: BackButtonSize
  className?: string
  iconOnly?: boolean
}

export function BackButton({
  label = 'Назад',
  href,
  onClick,
  variant = 'outline',
  size = 'icon',
  className,
  iconOnly = true,
}: Readonly<BackButtonProps>) {
  const content = (
    <>
      <ArrowLeft className="size-4" />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </>
  )

  if (href) {
    return (
      <Button variant={variant} size={size} className={className} asChild>
        <Link href={href}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
    >
      {content}
    </Button>
  )
}
