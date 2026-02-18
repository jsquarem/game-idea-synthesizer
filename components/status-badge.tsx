import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  active: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  deprecated: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  ideation: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
}

type StatusBadgeProps = {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <Badge variant="outline" className={cn('capitalize', style, className)}>
      {status}
    </Badge>
  )
}
