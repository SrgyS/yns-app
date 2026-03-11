'use client'

import Link, { type LinkProps } from 'next/link'
import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react'
import { startNavigationFeedback } from '@/shared/lib/navigation/navigation-feedback'

type AnchorProps = Omit<ComponentPropsWithoutRef<'a'>, keyof LinkProps>

export type SmartLinkProps = LinkProps &
  AnchorProps & {
    disableNavigationFeedback?: boolean
  }

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function isExternalHref(href: LinkProps['href']) {
  if (typeof href !== 'string') {
    return false
  }

  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
}

export const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
  function SmartLink(
    {
      disableNavigationFeedback = false,
      onClick,
      href,
      target,
      ...props
    },
    ref
  ) {
    return (
      <Link
        ref={ref}
        href={href}
        target={target}
        onClick={event => {
          onClick?.(event)

          if (event.defaultPrevented) {
            return
          }

          if (disableNavigationFeedback) {
            return
          }

          if (isModifiedEvent(event)) {
            return
          }

          if (target === '_blank') {
            return
          }

          if (typeof href === 'string' && href.startsWith('#')) {
            return
          }

          if (isExternalHref(href)) {
            return
          }

          startNavigationFeedback()
        }}
        {...props}
      />
    )
  }
)
