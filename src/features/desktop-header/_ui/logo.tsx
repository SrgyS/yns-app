import Link from 'next/link'
import Image from 'next/image'

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <Link className="flex items-center space-x-1" href="/">
      <Image src="/logo-yns.png" alt="Logo image" width={24} height={24} />
      {withText && (
        <span className="inline-block font-bold font-inter">
          ya&middot;na&middot;sporte
        </span>
      )}
    </Link>
  )
}
