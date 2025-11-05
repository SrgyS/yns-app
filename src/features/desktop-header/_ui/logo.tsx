import Link from 'next/link'
import Image from 'next/image'

export function Logo() {
  return (
    <Link className="flex items-center space-x-1" href="/">
      <Image src="/logo-yns.png" alt="Logo image" width={24} height={24} />
      <span className="font-bold inline-block">ya&middot;na&middot;sporte</span>
    </Link>
  )
}
