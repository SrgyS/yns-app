import Link from 'next/link'
import Image from 'next/image'

export function Logo() {
  return (
    <Link className="flex items-center space-x-2" href="/">
      <Image src="/yns-logo.png" alt="Logo image" width={32} height={32} />
      <span className="font-bold inline-block">Yanasporte.online</span>
    </Link>
  )
}
