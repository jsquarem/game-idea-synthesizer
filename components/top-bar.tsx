import Link from 'next/link'
import { Settings, User } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'

export function TopBar() {
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
        <Button variant="ghost" size="icon" aria-label="User menu">
          <User className="size-4" />
        </Button>
      </div>
    </header>
  )
}
