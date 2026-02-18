import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CRITICALITY_STYLES: Record<string, string> = {
  core: 'bg-criticality-core/20 text-criticality-core border-criticality-core/30',
  important: 'bg-criticality-important/20 text-criticality-important border-criticality-important/30',
  later: 'bg-criticality-later/20 text-criticality-later border-criticality-later/30',
}

type CriticalityBadgeProps = {
  value: string
  className?: string
}

export function CriticalityBadge({ value, className }: CriticalityBadgeProps) {
  const key = value.toLowerCase()
  const style = CRITICALITY_STYLES[key] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <Badge variant="outline" className={cn(style, className)}>
      {value}
    </Badge>
  )
}
