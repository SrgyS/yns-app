export function Layout({
  logo,
  nav,
  profile,
  actions,
}: {
  logo?: React.ReactNode
  nav?: React.ReactNode
  profile?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">{logo}</div>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex-1" />
          <div className="flex">{nav}</div>
          <div className="flex flex-1 items-center justify-end space-x-3">
            {actions}
            {profile}
          </div>
        </div>
      </div>
    </header>
  )
}
