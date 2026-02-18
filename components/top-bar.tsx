import Link from 'next/link'
import { Settings } from 'lucide-react'
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
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2 font-semibold text-foreground"
      >
        GamePlan AI
      </Link>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Settings" asChild>
          <Link href="/settings">
            <Settings className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Profile and settings" asChild>
          <Link href="/settings">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
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
