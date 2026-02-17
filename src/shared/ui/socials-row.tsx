import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/shared/ui/utils'

export const SocialsRow = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Link href="#" target="_blank">
        <div className="bg-white rounded-full overflow-hidden p-1">
          <Image
            src="/youtube-icon.png"
            alt="Youtube"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition"
          />
        </div>
      </Link>
      <Link href="#" target="_blank">
        <div className="bg-white rounded-full overflow-hidden p-1">
          <Image
            src="/telegram-icon.png"
            alt="Telegram"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition"
          />
        </div>
      </Link>
      <Link href="#" target="_blank">
        <div className="bg-white rounded-full overflow-hidden p-1">
          <Image
            src="/vk-icon.png"
            alt="VKontakte"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition"
          />
        </div>
      </Link>
      <Link href="#" target="_blank" className="relative">
        <div className="bg-white rounded-full overflow-hidden p-1">
          <Image
            src="/instagram-icon.png"
            alt="Instagram"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition"
          />
        </div>
        <span className="absolute -right-1 -top-2 text-sm font-semibold text-slate-200">
          *
        </span>
      </Link>
    </div>
  )
}
