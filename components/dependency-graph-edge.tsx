'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useViewport,
  type EdgeProps,
} from '@xyflow/react'

/** Stable numeric hash from string for deterministic edge offset. */
function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function DependencyGraphEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const { zoom } = useViewport()
  const showLabel = zoom >= 0.45
  const horizontalDistance = Math.abs(sourceX - targetX)
  const verticalDistance = Math.abs(sourceY - targetY)
  const proximityBoost = horizontalDistance < 120 ? 14 : horizontalDistance < 220 ? 8 : 0
  const spanBoost = Math.min(10, Math.round(verticalDistance / 320))
  const offset = 30 + (simpleHash(id) % 36) + proximityBoost + spanBoost
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
    offset,
    stepPosition: 0.5,
  })
  const label = (data?.label as string | undefined) ?? ''
  const edgeColor = (data?.edgeColor as string | undefined) ?? '#00d4ff'

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
      />
      {label && showLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan rounded border px-2 py-1 text-xs font-medium"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              maxWidth: 200,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              background: '#1a1a2e',
              border: `1px solid ${edgeColor}`,
              color: edgeColor,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

export const DependencyGraphEdge = memo(DependencyGraphEdgeComponent)
