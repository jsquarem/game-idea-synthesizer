'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import type { SystemNodeData } from '@/lib/graph/transform'

const CRITICALITY_NODE_CLASS: Record<string, string> = {
  core: 'bg-criticality-core/20 border-criticality-core',
  important: 'bg-criticality-important/20 border-criticality-important',
  later: 'bg-criticality-later/20 border-criticality-later',
}

const STATUS_BORDER_CLASS: Record<string, string> = {
  draft: 'border-dashed border-status-draft',
  active: 'border-solid border-status-active',
  deprecated: 'border-dashed border-status-deprecated',
}

function SystemNodeComponent(props: NodeProps<Node<SystemNodeData>>) {
  const { data, selected } = props
  const criticality = (data.mvpCriticality ?? 'later').toLowerCase()
  const status = (data.status ?? 'draft').toLowerCase()
  const criticalityClass = CRITICALITY_NODE_CLASS[criticality] ?? CRITICALITY_NODE_CLASS.later
  const statusBorderClass = STATUS_BORDER_CLASS[status] ?? 'border-dashed border-border'

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-2" />
      <div
        className={cn(
          'rounded-lg border-2 px-3 py-2 min-w-[180px] shadow-sm transition-shadow',
          criticalityClass,
          statusBorderClass,
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        <div className="text-sm font-semibold text-foreground truncate">{data.label}</div>
        <div className="mt-1 flex items-center gap-1.5">
          <StatusBadge status={data.status} className="text-[10px] px-1.5 py-0" />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2" />
    </>
  )
}

export const SystemNode = memo(SystemNodeComponent)
