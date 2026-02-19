import type { Edge, Node } from '@xyflow/react'

export type LayoutEngineChoice = 'elk' | 'graphviz'

export type LayoutMetrics = {
  width: number
  height: number
  aspectRatio: number
  averageEdgeSpan: number
  crossingCount: number
}

export type LayoutCandidate<TData extends Record<string, unknown>> = {
  engine: LayoutEngineChoice
  nodes: Node<TData>[]
  edges: Edge[]
  metrics: LayoutMetrics
  score: number
}

function edgeSpan(source: Node, target: Node): number {
  const sx = source.position.x + (source.width ?? 0) / 2
  const sy = source.position.y + (source.height ?? 0) / 2
  const tx = target.position.x + (target.width ?? 0) / 2
  const ty = target.position.y + (target.height ?? 0) / 2
  return Math.abs(sx - tx) + Math.abs(sy - ty)
}

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (by - ay) * (cx - bx) - (bx - ax) * (cy - by)
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): boolean {
  const o1 = orientation(ax, ay, bx, by, cx, cy)
  const o2 = orientation(ax, ay, bx, by, dx, dy)
  const o3 = orientation(cx, cy, dx, dy, ax, ay)
  const o4 = orientation(cx, cy, dx, dy, bx, by)
  return o1 * o2 < 0 && o3 * o4 < 0
}

function centerPoint(node: Node): { x: number; y: number } {
  return {
    x: node.position.x + (node.width ?? 0) / 2,
    y: node.position.y + (node.height ?? 0) / 2,
  }
}

function countApproximateCrossings(nodes: Node[], edges: Edge[]): number {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  let count = 0

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i]
      const b = edges[j]
      if (
        a.source === b.source ||
        a.source === b.target ||
        a.target === b.source ||
        a.target === b.target
      ) {
        continue
      }
      const aSource = nodeById.get(a.source)
      const aTarget = nodeById.get(a.target)
      const bSource = nodeById.get(b.source)
      const bTarget = nodeById.get(b.target)
      if (!aSource || !aTarget || !bSource || !bTarget) continue

      const p1 = centerPoint(aSource)
      const p2 = centerPoint(aTarget)
      const p3 = centerPoint(bSource)
      const p4 = centerPoint(bTarget)
      if (segmentsIntersect(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)) {
        count += 1
      }
    }
  }

  return count
}

export function computeLayoutMetrics(nodes: Node[], edges: Edge[]): LayoutMetrics {
  if (nodes.length === 0) {
    return {
      width: 0,
      height: 0,
      aspectRatio: 1,
      averageEdgeSpan: 0,
      crossingCount: 0,
    }
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    const width = node.width ?? 0
    const height = node.height ?? 0
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + width)
    maxY = Math.max(maxY, node.position.y + height)
  }

  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const aspectRatio = width / height
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const spanSum = edges.reduce((sum, edge) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    if (!source || !target) return sum
    return sum + edgeSpan(source, target)
  }, 0)

  return {
    width,
    height,
    aspectRatio,
    averageEdgeSpan: edges.length === 0 ? 0 : spanSum / edges.length,
    crossingCount: countApproximateCrossings(nodes, edges),
  }
}

export function scoreLayout(metrics: LayoutMetrics): number {
  const squarePenalty = Math.abs(Math.log(metrics.aspectRatio))
  const crossingPenalty = metrics.crossingCount
  const diagonal = Math.sqrt(metrics.width * metrics.width + metrics.height * metrics.height)
  const spanPenalty = metrics.averageEdgeSpan / Math.max(diagonal, 1)
  return squarePenalty * 5 + crossingPenalty * 0.75 + spanPenalty * 2
}

export function chooseBestLayout<TData extends Record<string, unknown>>(
  candidates: LayoutCandidate<TData>[]
): LayoutCandidate<TData> {
  return candidates.reduce((best, current) => {
    if (current.score < best.score) return current
    return best
  })
}
