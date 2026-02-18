import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { avatarColorFromUser, getInitials } from '@/lib/avatar'

type TopBarUser = {
  id: string
  displayName: string | null
  avatarColor: string | null
}

export function TopBar({ user }: { user: TopBarUser | null }) {
  const bgColor = user
    ? avatarColorFromUser(user.id, user.avatarColor)
    : 'hsl(var(--muted))'
  const initials = user ? getInitials(user.displayName) : '?'

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight text-foreground hover:text-foreground/80 transition-colors"
      >
        GamePlan AI
      </Link>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Profile and settings" asChild>
          <Link href="/settings">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-transparent hover:ring-primary/30 transition-all"
              style={{ backgroundColor: bgColor }}
            >
              {initials}
            </span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
