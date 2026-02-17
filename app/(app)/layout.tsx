import Link from 'next/link'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b border-border bg-muted/30 md:w-64 md:border-b-0 md:border-r">
        <nav className="flex flex-wrap gap-2 p-4 md:flex-col md:gap-1">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
