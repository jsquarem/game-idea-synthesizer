'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, X, Loader2, SkipForward, Circle, ChevronDown, ChevronRight } from 'lucide-react'
import type { StepStatus, ParamRefEntry } from '@/lib/ai/action-plan/types'

type ActionStepCardProps = {
  stepIndex: number
  stepId: string
  description: string
  toolName: string
  params: { key: string; value: string }[]
  paramRefs: ParamRefEntry[]
  status: StepStatus
  error?: string
}

const statusConfig: Record<StepStatus, { icon: typeof Check; className: string; label: string }> = {
  pending: { icon: Circle, className: 'text-muted-foreground', label: 'Pending' },
  running: { icon: Loader2, className: 'text-blue-500 animate-spin', label: 'Running' },
  completed: { icon: Check, className: 'text-green-500', label: 'Completed' },
  failed: { icon: X, className: 'text-red-500', label: 'Failed' },
  skipped: { icon: SkipForward, className: 'text-amber-500', label: 'Skipped' },
}

export function ActionStepCard({
  stepIndex,
  stepId,
  description,
  toolName,
  params,
  paramRefs,
  status,
  error,
}: ActionStepCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div
      className={cn(
        'rounded-md border p-3 transition-colors',
        status === 'running' && 'border-blue-500/50 bg-blue-500/5',
        status === 'completed' && 'border-green-500/30 bg-green-500/5',
        status === 'failed' && 'border-red-500/30 bg-red-500/5',
        status === 'skipped' && 'border-amber-500/30 bg-amber-500/5 opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-bold">
          {stepIndex + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{description}</p>
            <StatusIcon className={cn('size-4 shrink-0', config.className)} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {toolName}
            </Badge>
            {paramRefs.map((ref) => (
              <Badge key={ref.paramName} variant="outline" className="text-[10px]">
                {ref.paramName} from Step {ref.stepIndex + 1}
              </Badge>
            ))}
          </div>
          {error && (
            <p className="mt-1.5 text-xs text-red-500">{error}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse params' : 'Expand params'}
        >
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </Button>
      </div>
      {expanded && (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(
            Object.fromEntries(params.map((p) => [p.key, p.value])),
            null,
            2
          )}
        </pre>
      )}
    </div>
  )
}
