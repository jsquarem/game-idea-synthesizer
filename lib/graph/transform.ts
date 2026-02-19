import type { Node, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'
import dagre from 'dagre'

const NODE_WIDTH = 200
const NODE_HEIGHT = 72

export type SystemForTransform = {
  id: string
  name: string
  status: string
  mvpCriticality: string
}

export type EdgeForTransform = {
  sourceId: string
  targetId: string
  type?: string
}

export type LayoutDirection = 'TB' | 'LR'

/**
 * Transform systems and edges into React Flow nodes and edges with dagre layout.
 * Node IDs = system id; edge IDs = sourceId-targetId.
 */
export function transformToReactFlow(
  systems: SystemForTransform[],
  edges: EdgeForTransform[],
  direction: LayoutDirection = 'TB'
): { nodes: Node<SystemNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 })

  for (const system of systems) {
    g.setNode(system.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const e of edges) {
    if (systems.some((s) => s.id === e.sourceId) && systems.some((s) => s.id === e.targetId)) {
      g.setEdge(e.sourceId, e.targetId)
    }
  }

  dagre.layout(g)

  const isHorizontal = direction === 'LR'
  const nodes: Node<SystemNodeData>[] = systems.map((system) => {
    const pos = g.node(system.id)
    return {
      id: system.id,
      type: 'systemNode',
      position: {
        x: pos != null ? pos.x - NODE_WIDTH / 2 : 0,
        y: pos != null ? pos.y - NODE_HEIGHT / 2 : 0,
      },
      data: {
        label: system.name,
        status: system.status,
        mvpCriticality: system.mvpCriticality,
      },
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
    }
  })

  const edgeList: Edge[] = edges.map((e) => ({
    id: `${e.sourceId}-${e.targetId}`,
    source: e.sourceId,
    target: e.targetId,
    type: 'default',
    markerEnd: { type: 'arrowclosed' },
    style: {
      stroke: 'hsl(var(--foreground) / 0.75)',
      strokeWidth: 2,
    },
  }))

  return { nodes, edges: edgeList }
}

export type SystemNodeData = {
  label: string
  status: string
  mvpCriticality: string
}
