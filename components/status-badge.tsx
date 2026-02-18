import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-status-draft/20 text-status-draft border-status-draft/30',
  active: 'bg-status-active/20 text-status-active border-status-active/30',
  deprecated: 'bg-status-deprecated/20 text-status-deprecated border-status-deprecated/30',
  ideation: 'bg-sky-400/20 text-sky-400 border-sky-400/30',
  archived: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
}

type StatusBadgeProps = {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <Badge variant="outline" className={cn(style, className)}>
      {status}
    </Badge>
  )
}
