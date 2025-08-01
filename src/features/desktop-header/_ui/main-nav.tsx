import Link from 'next/link'

export function MainNav() {
  return (
    <nav className="flex items-center gap-6 text-sm font-medium flex-row">
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/"
      >
        Главная
      </Link>
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/practices"
      >
        Практики
      </Link>
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/recipes"
      >
        Рецепты
      </Link>
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/knowledge"
      >
        Знания
      </Link>
    </nav>
  )
}
