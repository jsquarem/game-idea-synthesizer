import type { Node, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'
import ELK from 'elkjs/lib/elk.bundled.js'
import {
  chooseBestLayout,
  computeLayoutMetrics,
  scoreLayout,
  type LayoutCandidate,
} from '@/lib/graph/layout-bakeoff'

const NODE_WIDTH = 200
const NODE_HEIGHT = 72

const MIN_SPACING_SCALE = 1
const MAX_SPACING_SCALE = 1.6
const BROWSER_DPI = 96
const DOT_POINTS_PER_INCH = 72

/** Complementary palette for per-link edge and label colors (visible on dark background). */
const EDGE_COLOR_PALETTE = [
  '#00d4ff', // cyan
  '#ff6b6b', // coral
  '#ffd93d', // gold
  '#6bcb77', // mint
  '#4d96ff', // blue
  '#ff8c42', // orange
  '#9b59b6', // violet
  '#00b894', // teal
  '#e056fd', // magenta
  '#f9ca24', // yellow
  '#1dd1a1', // green
  '#ff9f43', // saffron
  '#54a0ff', // light blue
  '#5f27cd', // purple
  '#00d2d3', // cyan2
  '#ee5a24', // tangerine
  '#c8d6af', // light green
  '#ff7979', // pastel red
  '#7ed6df', // aqua
  '#feca57', // sun flower
]
const CRITICALITY_ORDER: Record<string, number> = {
  core: 0,
  important: 1,
  later: 2,
}

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
  description?: string | null
}

export type LayoutDirection = 'TB' | 'LR'
type LayoutEngineStrategy = 'auto' | 'elk' | 'graphviz'
type DotObject = { name?: string; pos?: string }
type DotJson = { bb?: string; objects?: DotObject[] }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function spacingScale(nodeCount: number, edgeCount: number): number {
  const nodePressure = Math.max(nodeCount - 8, 0) / 38
  const density = edgeCount / Math.max(nodeCount, 1)
  const densityPressure = Math.max(density - 1.1, 0) / 5
  return clamp(1 + nodePressure + densityPressure, MIN_SPACING_SCALE, MAX_SPACING_SCALE)
}

function normalizedStrategy(override?: LayoutEngineStrategy): LayoutEngineStrategy {
  if (override && (override === 'elk' || override === 'graphviz' || override === 'auto')) {
    return override
  }
  const raw = process.env.NEXT_PUBLIC_GRAPH_LAYOUT_STRATEGY?.toLowerCase() ?? 'auto'
  if (raw === 'elk' || raw === 'graphviz' || raw === 'auto') return raw
  return 'auto'
}

function buildElkLayoutOptionsForBakeoff(
  direction: LayoutDirection,
  nodeCount: number,
  edgeCount: number
): Record<string, string> {
  const scale = spacingScale(nodeCount, edgeCount)
  const isHorizontal = direction === 'LR'
  const layerSpacingBase = isHorizontal ? 220 : 210
  const sameLayerSpacingBase = isHorizontal ? 180 : 185
  const edgeNodeSpacingBase = isHorizontal ? 100 : 110

  return {
    'elk.algorithm': 'layered',
    'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.aspectRatio': '1.0',
    'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.round(layerSpacingBase * scale * 0.95)),
    'elk.spacing.nodeNode': String(Math.round(sameLayerSpacingBase * scale * 1.1)),
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.cycleBreaking.strategy': 'GREEDY',
    'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    'elk.layered.nodePlacement.favorStraightEdges': 'false',
    'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.round(edgeNodeSpacingBase * scale)),
    'elk.layered.thoroughness': '20',
  }
}

/** Clean edge label: prefer description, then type, otherwise empty. */
function edgeLabel(description?: string | null, type?: string): string {
  const d = typeof description === 'string' ? description.trim() : ''
  const t = typeof type === 'string' ? type.trim() : ''
  return d || t || ''
}

/**
 * Deterministic ordering used only as tie-breaker input order.
 */
function orderedSystems(systems: SystemForTransform[], validEdges: EdgeForTransform[]): SystemForTransform[] {
  const outDegree = new Map<string, number>()
  const inDegree = new Map<string, number>()
  for (const system of systems) {
    outDegree.set(system.id, 0)
    inDegree.set(system.id, 0)
  }
  for (const edge of validEdges) {
    outDegree.set(edge.sourceId, (outDegree.get(edge.sourceId) ?? 0) + 1)
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) ?? 0) + 1)
  }
  return [...systems].sort((a, b) => {
    const oa = outDegree.get(a.id) ?? 0
    const ob = outDegree.get(b.id) ?? 0
    if (oa !== ob) return ob - oa
    const ia = inDegree.get(a.id) ?? 0
    const ib = inDegree.get(b.id) ?? 0
    if (ia !== ib) return ia - ib
    const ca = CRITICALITY_ORDER[a.mvpCriticality?.toLowerCase() ?? ''] ?? 1
    const cb = CRITICALITY_ORDER[b.mvpCriticality?.toLowerCase() ?? ''] ?? 1
    if (ca !== cb) return ca - cb
    return a.id.localeCompare(b.id)
  })
}

function buildFlowNode(
  system: SystemForTransform | undefined,
  id: string,
  x: number,
  y: number,
  direction: LayoutDirection
): Node<SystemNodeData> {
  const isHorizontal = direction === 'LR'
  return {
    id,
    type: 'systemNode',
    position: { x, y },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    data: system
      ? {
          label: system.name,
          status: system.status,
          mvpCriticality: system.mvpCriticality,
        }
      : { label: '', status: '', mvpCriticality: '' },
    sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
    targetPosition: isHorizontal ? Position.Left : Position.Top,
  }
}

function buildEdgeList(validEdges: EdgeForTransform[]): Edge[] {
  return validEdges.map((e, i) => {
    const edgeColor = EDGE_COLOR_PALETTE[i % EDGE_COLOR_PALETTE.length]
    return {
      id: `${e.sourceId}-${e.targetId}`,
      source: e.sourceId,
      target: e.targetId,
      type: 'dependencyEdge',
      data: {
        label: edgeLabel(e.description, e.type),
        edgeColor,
      },
      markerEnd: { type: 'arrowclosed', color: edgeColor },
      style: {
        stroke: edgeColor,
        strokeWidth: 4,
      },
    }
  })
}

function parsePair(value: string): [number, number] | null {
  const [xRaw, yRaw] = value.split(',')
  const x = Number(xRaw)
  const y = Number(yRaw)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return [x, y]
}

function parseBoundingBox(bb: string | undefined): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (!bb) return null
  const [minXRaw, minYRaw, maxXRaw, maxYRaw] = bb.split(',')
  const minX = Number(minXRaw)
  const minY = Number(minYRaw)
  const maxX = Number(maxXRaw)
  const maxY = Number(maxYRaw)
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null
  return { minX, minY, maxX, maxY }
}

export type LayoutEngineUsed = 'elk' | 'graphviz'

/**
 * Build React Flow nodes and edges with a layout bake-off.
 * Candidate A: ELK layered. Candidate B: Graphviz DOT.
 * Winner is selected by readability score (square footprint + lower crossing proxy).
 */
export async function getLayoutedFlow(
  systems: SystemForTransform[],
  edges: EdgeForTransform[],
  direction: LayoutDirection = 'TB',
  layoutEngineOverride?: LayoutEngineStrategy
): Promise<{ nodes: Node<SystemNodeData>[]; edges: Edge[]; layoutEngineUsed: LayoutEngineUsed }> {
  const systemIds = new Set(systems.map((s) => s.id))
  const validEdges = edges.filter(
    (e) => systemIds.has(e.sourceId) && systemIds.has(e.targetId)
  )
  const ordered = orderedSystems(systems, validEdges)
  const edgeList = buildEdgeList(validEdges)
  const requestedStrategy = normalizedStrategy(layoutEngineOverride)

  if (requestedStrategy === 'graphviz') {
    const graphvizNodes = await layoutWithGraphviz(ordered, validEdges, direction)
    if (graphvizNodes) {
      return { nodes: graphvizNodes, edges: edgeList, layoutEngineUsed: 'graphviz' }
    }
    const elkNodes = await layoutWithElk(ordered, validEdges, direction)
    return { nodes: elkNodes, edges: edgeList, layoutEngineUsed: 'elk' }
  }

  if (requestedStrategy === 'elk') {
    const elkNodes = await layoutWithElk(ordered, validEdges, direction)
    return { nodes: elkNodes, edges: edgeList, layoutEngineUsed: 'elk' }
  }

  const candidates: LayoutCandidate<SystemNodeData>[] = []

  const elkNodes = await layoutWithElk(ordered, validEdges, direction)
  candidates.push({
    engine: 'elk',
    nodes: elkNodes,
    edges: edgeList,
    metrics: computeLayoutMetrics(elkNodes, edgeList),
    score: scoreLayout(computeLayoutMetrics(elkNodes, edgeList)),
  })

  const graphvizNodes = await layoutWithGraphviz(ordered, validEdges, direction)
  if (graphvizNodes) {
    candidates.push({
      engine: 'graphviz',
      nodes: graphvizNodes,
      edges: edgeList,
      metrics: computeLayoutMetrics(graphvizNodes, edgeList),
      score: scoreLayout(computeLayoutMetrics(graphvizNodes, edgeList)),
    })
  }

  const winner = chooseBestLayout(candidates)
  if (process.env.NODE_ENV !== 'production') {
    console.info('[graph-layout-bakeoff]', {
      requestedStrategy: 'auto',
      nodeCount: systems.length,
      edgeCount: validEdges.length,
      winner: winner.engine,
    })
  }
  return { nodes: winner.nodes, edges: edgeList, layoutEngineUsed: winner.engine }
}

async function layoutWithElk(
  systems: SystemForTransform[],
  validEdges: EdgeForTransform[],
  direction: LayoutDirection
): Promise<Node<SystemNodeData>[]> {
  const elk = new ELK()
  const elkGraph = {
    id: 'root',
    layoutOptions: buildElkLayoutOptionsForBakeoff(direction, systems.length, validEdges.length),
    children: systems.map((system) => ({
      id: system.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: validEdges.map((edge) => ({
      id: `${edge.sourceId}-${edge.targetId}`,
      sources: [edge.sourceId],
      targets: [edge.targetId],
    })),
  }

  const layouted = await elk.layout(elkGraph)
  const systemMap = new Map(systems.map((system) => [system.id, system]))
  return (layouted.children ?? []).map((child) => {
    const x = child.x ?? 0
    const y = child.y ?? 0
    return buildFlowNode(systemMap.get(child.id), child.id, x, y, direction)
  })
}

function quoteDotId(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * Spacing for DOT: scale with graph size so larger graphs get more room.
 */
function graphvizSpacing(nodeCount: number, edgeCount: number): { ranksep: number; nodesep: number } {
  const baseRank = 0.8
  const baseNode = 0.6
  const nodeScale = 1 + Math.max(nodeCount - 6, 0) * 0.08
  const density = edgeCount / Math.max(nodeCount, 1)
  const densityScale = 1 + Math.max(density - 1, 0) * 0.15
  return {
    ranksep: Math.min(2.2, baseRank * nodeScale * densityScale),
    nodesep: Math.min(1.2, baseNode * nodeScale * densityScale),
  }
}

async function layoutWithGraphviz(
  systems: SystemForTransform[],
  validEdges: EdgeForTransform[],
  direction: LayoutDirection
): Promise<Node<SystemNodeData>[] | null> {
  const { ranksep, nodesep } = graphvizSpacing(systems.length, validEdges.length)
  const dotNodeWidth = (NODE_WIDTH / BROWSER_DPI).toFixed(3)
  const dotNodeHeight = (NODE_HEIGHT / BROWSER_DPI).toFixed(3)
  const rankdir = direction === 'LR' ? 'LR' : 'TB'
  const dot = [
    'digraph dependencies {',
    `  graph [rankdir=${rankdir}, ratio=1.0, ranksep=${ranksep}, nodesep=${nodesep}, splines=ortho];`,
    `  node [shape=box, fixedsize=true, width=${dotNodeWidth}, height=${dotNodeHeight}];`,
    ...systems.map((s) => `  ${quoteDotId(s.id)};`),
    ...validEdges.map((e) => `  ${quoteDotId(e.sourceId)} -> ${quoteDotId(e.targetId)};`),
    '}',
  ].join('\n')

  try {
    const { Graphviz } = await import('@hpcc-js/wasm-graphviz')
    const graphviz = await Graphviz.load()
    const jsonOutput = await graphviz.layout(dot, 'json', 'dot')
    const parsed = JSON.parse(jsonOutput as string) as DotJson
    const box = parseBoundingBox(parsed.bb)
    const maxY = box?.maxY ?? 0
    const scale = BROWSER_DPI / DOT_POINTS_PER_INCH
    const systemMap = new Map(systems.map((system) => [system.id, system]))
    const nodes: Node<SystemNodeData>[] = []

    for (const object of parsed.objects ?? []) {
      const id = object.name
      if (!id || !systemMap.has(id) || !object.pos) continue
      const parsedPos = parsePair(object.pos)
      if (!parsedPos) continue
      const [dotX, dotY] = parsedPos
      const x = dotX * scale - NODE_WIDTH / 2
      const y = (maxY - dotY) * scale - NODE_HEIGHT / 2
      nodes.push(buildFlowNode(systemMap.get(id), id, x, y, direction))
    }

    if (nodes.length !== systems.length) {
      return null
    }

    return nodes
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[graph-layout-bakeoff] graphviz layout failed, falling back to ELK', error)
    }
    return null
  }
}

export type SystemNodeData = {
  label: string
  status: string
  mvpCriticality: string
}
