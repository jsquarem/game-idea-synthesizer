import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CRITICALITY_STYLES: Record<string, string> = {
  core: 'bg-red-500/20 text-red-500 border-red-500/30',
  important: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  later: 'bg-sky-400/20 text-sky-400 border-sky-400/30',
}

type CriticalityBadgeProps = {
  value: string
  className?: string
}

export function CriticalityBadge({ value, className }: CriticalityBadgeProps) {
  const key = value.toLowerCase()
  const style = CRITICALITY_STYLES[key] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <Badge variant="outline" className={cn('capitalize', style, className)}>
      {value}
    </Badge>
  )
}
