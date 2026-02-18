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
}

export function StatCard({ icon: Icon, label, value, href, className }: StatCardProps) {
  const content = (
    <>
      <Icon className="size-5 text-muted-foreground" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </>
  )

  const cardClass = cn(
    'transition-shadow hover:shadow-lg hover:-translate-y-0.5',
    href && 'cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href}>
        <Card className={cardClass}>
          <CardContent className="flex flex-col gap-2 p-6">{content}</CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card className={cardClass}>
      <CardContent className="flex flex-col gap-2 p-6">{content}</CardContent>
    </Card>
  )
}
