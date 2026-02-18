import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  href?: string
  className?: string
  /** Optional badge shown in the card (e.g. "Unread", "Up to date") */
  badge?: React.ReactNode
}

export function StatCard({ icon: Icon, label, value, href, className, badge }: StatCardProps) {
  const content = (
    <>
      {badge != null ? (
        <div className="flex items-start justify-between gap-2">
          <Icon className="size-5 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
        </div>
      ) : (
        <Icon className="size-5 text-muted-foreground" />
      )}
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </>
  )

  const cardClass = cn(
    'transition-shadow duration-150 hover:shadow-md',
    href && 'cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href}>
        <Card className={cardClass}>
          <CardContent className="flex flex-col gap-2">{content}</CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card className={cardClass}>
      <CardContent className="flex flex-col gap-2">{content}</CardContent>
    </Card>
  )
}
