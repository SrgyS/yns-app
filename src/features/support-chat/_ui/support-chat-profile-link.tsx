'use client'

import Link from 'next/link'
import { ChevronRight, MessageCircle } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { useSupportChatUnansweredCount } from '../_vm/use-support-chat'

export function SupportChatProfileLink() {
  const unansweredCountQuery = useSupportChatUnansweredCount()
  const hasUnread = (unansweredCountQuery.data?.count ?? 0) > 0

  return (
    <Button asChild className="w-full justify-between" variant="outline">
      <Link href="/platform/support-chat">
        <div className="relative flex items-center gap-2 pr-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span>Написать в поддержку</span>
          {hasUnread ? (
            <span className="absolute -top-1 left-3 h-2.5 w-2.5 rounded-full bg-orange-500" />
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </Button>
  )
}
