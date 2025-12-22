export function Layout({
  logo,
  nav,
  profile,
  actions,
}: Readonly<{
  logo?: React.ReactNode
  nav?: React.ReactNode
  profile?: React.ReactNode
  actions?: React.ReactNode
}>) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container relative flex h-14 items-center justify-between px-4 md:px-0">
        <div className="mr-4 flex flex-1 items-center">{logo}</div>
        <div className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex">
          <div className="pointer-events-auto flex">{nav}</div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-3">
          {actions}
          {profile}
        </div>
      </div>
    </header>
  )
}
