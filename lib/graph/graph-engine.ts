import type { GraphNode, GraphEdge, DirectedGraph } from './types'

export function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): DirectedGraph {
  const nodeMap = new Map<string, GraphNode>()
  const adj = new Map<string, Set<string>>()
  const rev = new Map<string, Set<string>>()
  for (const n of nodes) {
    nodeMap.set(n.id, n)
    adj.set(n.id, new Set())
    rev.set(n.id, new Set())
  }
  for (const e of edges) {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      adj.get(e.source)!.add(e.target)
      rev.get(e.target)!.add(e.source)
    }
  }
  return { nodes: nodeMap, adjacencyList: adj, reverseAdjacencyList: rev }
}

export function addNode(graph: DirectedGraph, node: GraphNode): void {
  graph.nodes.set(node.id, node)
  graph.adjacencyList.set(node.id, new Set())
  graph.reverseAdjacencyList.set(node.id, new Set())
}

export function removeNode(graph: DirectedGraph, nodeId: string): void {
  graph.nodes.delete(nodeId)
  const out = graph.adjacencyList.get(nodeId)
  if (out) for (const t of out) graph.reverseAdjacencyList.get(t)?.delete(nodeId)
  graph.adjacencyList.delete(nodeId)
  const inc = graph.reverseAdjacencyList.get(nodeId)
  if (inc) for (const s of inc) graph.adjacencyList.get(s)?.delete(nodeId)
  graph.reverseAdjacencyList.delete(nodeId)
}

export function addEdge(
  graph: DirectedGraph,
  source: string,
  target: string
): boolean {
  if (wouldCreateCycle(graph, source, target)) return false
  graph.adjacencyList.get(source)?.add(target)
  graph.reverseAdjacencyList.get(target)?.add(source)
  return true
}

export function removeEdge(graph: DirectedGraph, source: string, target: string): void {
  graph.adjacencyList.get(source)?.delete(target)
  graph.reverseAdjacencyList.get(target)?.delete(source)
}

export function detectCycles(graph: DirectedGraph): string[][] {
  const cycles: string[][] = []
  const color = new Map<string, 'white' | 'gray' | 'black'>()
  for (const id of graph.nodes.keys()) color.set(id, 'white')

  function dfs(u: string, path: string[]): boolean {
    color.set(u, 'gray')
    path.push(u)
    const out = graph.adjacencyList.get(u)
    if (out) {
      for (const v of out) {
        if (color.get(v) === 'gray') {
          const start = path.indexOf(v)
          cycles.push(path.slice(start))
          path.pop()
          color.set(u, 'black')
          return true
        }
        if (color.get(v) === 'white' && dfs(v, path)) {
          path.pop()
          color.set(u, 'black')
          return true
        }
      }
    }
    path.pop()
    color.set(u, 'black')
    return false
  }

  for (const id of graph.nodes.keys()) {
    if (color.get(id) === 'white') dfs(id, [])
  }
  return cycles
}

export function wouldCreateCycle(
  graph: DirectedGraph,
  source: string,
  target: string
): boolean {
  if (source === target) return true
  const reachable = new Set<string>()
  const stack = [target]
  while (stack.length) {
    const u = stack.pop()!
    if (u === source) return true
    if (reachable.has(u)) continue
    reachable.add(u)
    const out = graph.adjacencyList.get(u)
    if (out) for (const v of out) stack.push(v)
  }
  return false
}

export function topologicalSort(graph: DirectedGraph): string[] | null {
  if (detectCycles(graph).length > 0) return null
  const inDegree = new Map<string, number>()
  for (const id of graph.nodes.keys()) inDegree.set(id, 0)
  for (const [, targets] of graph.adjacencyList) {
    for (const t of targets) inDegree.set(t, (inDegree.get(t) ?? 0) + 1)
  }
  const queue: string[] = []
  for (const [id, d] of inDegree) if (d === 0) queue.push(id)
  const order: string[] = []
  while (queue.length) {
    const u = queue.shift()!
    order.push(u)
    const out = graph.adjacencyList.get(u)
    if (out) for (const v of out) {
      inDegree.set(v, inDegree.get(v)! - 1)
      if (inDegree.get(v) === 0) queue.push(v)
    }
  }
  return order.length === graph.nodes.size ? order : null
}

export function getDirectUpstream(graph: DirectedGraph, nodeId: string): string[] {
  return Array.from(graph.adjacencyList.get(nodeId) ?? [])
}

export function getDirectDownstream(graph: DirectedGraph, nodeId: string): string[] {
  return Array.from(graph.reverseAdjacencyList.get(nodeId) ?? [])
}

export function getTransitiveUpstream(graph: DirectedGraph, nodeId: string): string[] {
  const set = new Set<string>()
  const stack = [nodeId]
  while (stack.length) {
    const u = stack.pop()!
    const out = graph.adjacencyList.get(u)
    if (out) for (const v of out) {
      if (!set.has(v)) { set.add(v); stack.push(v) }
    }
  }
  return Array.from(set)
}

export function getTransitiveDownstream(graph: DirectedGraph, nodeId: string): string[] {
  const set = new Set<string>()
  const stack = [nodeId]
  while (stack.length) {
    const u = stack.pop()!
    const inc = graph.reverseAdjacencyList.get(u)
    if (inc) for (const v of inc) {
      if (!set.has(v)) { set.add(v); stack.push(v) }
    }
  }
  return Array.from(set)
}

export function analyzeImpact(graph: DirectedGraph, nodeId: string) {
  const directUpstream = getDirectUpstream(graph, nodeId)
  const directDownstream = getDirectDownstream(graph, nodeId)
  const transitiveUpstream = getTransitiveUpstream(graph, nodeId)
  const transitiveDownstream = getTransitiveDownstream(graph, nodeId)
  const affected = new Set(transitiveDownstream)
  affected.add(nodeId)
  const order = topologicalSortSubset(graph, affected)
  return {
    directUpstream,
    directDownstream,
    transitiveUpstream,
    transitiveDownstream,
    riskSurface: transitiveDownstream,
    implementationOrder: order ?? [],
  }
}

export function topologicalSortSubset(
  graph: DirectedGraph,
  subsetNodeIds: Set<string>
): string[] | null {
  const sub = extractSubgraph(graph, subsetNodeIds)
  return topologicalSort(sub)
}

export function extractSubgraph(
  graph: DirectedGraph,
  nodeIds: Set<string>
): DirectedGraph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  for (const id of nodeIds) {
    const n = graph.nodes.get(id)
    if (n) nodes.push(n)
  }
  for (const id of nodeIds) {
    const out = graph.adjacencyList.get(id)
    if (out) for (const t of out) if (nodeIds.has(t)) edges.push({ source: id, target: t, type: 'requires' })
  }
  return buildGraph(nodes, edges)
}

export function validateScope(
  graph: DirectedGraph,
  nodeIds: Set<string>
): { valid: boolean; missingDependencies: { nodeId: string; missingDep: string }[] } {
  const missing: { nodeId: string; missingDep: string }[] = []
  for (const id of nodeIds) {
    const deps = graph.reverseAdjacencyList.get(id)
    if (deps) for (const d of deps) if (!nodeIds.has(d)) missing.push({ nodeId: id, missingDep: d })
  }
  return { valid: missing.length === 0, missingDependencies: missing }
}

export function computePhases(
  graph: DirectedGraph,
  nodeIds?: Set<string>
): Map<number, string[]> {
  const ids = nodeIds ?? new Set(graph.nodes.keys())
  const sub = extractSubgraph(graph, ids)
  const inDegree = new Map<string, number>()
  for (const id of sub.nodes.keys()) inDegree.set(id, 0)
  for (const [, targets] of sub.adjacencyList) {
    for (const t of targets) inDegree.set(t, (inDegree.get(t) ?? 0) + 1)
  }
  const phases = new Map<number, string[]>()
  let phase = 1
  const remaining = new Set(sub.nodes.keys())
  while (remaining.size) {
    const layer: string[] = []
    for (const id of remaining) {
      if (inDegree.get(id) === 0) layer.push(id)
    }
    if (layer.length === 0) break
    phases.set(phase, layer)
    for (const id of layer) {
      remaining.delete(id)
      const out = sub.adjacencyList.get(id)
      if (out) for (const t of out) inDegree.set(t, inDegree.get(t)! - 1)
    }
    phase++
  }
  return phases
}

export function identifyRiskNodes(graph: DirectedGraph) {
  const fanIn: { nodeId: string; count: number }[] = []
  const fanOut: { nodeId: string; count: number }[] = []
  const isolated: string[] = []
  for (const id of graph.nodes.keys()) {
    const inC = graph.reverseAdjacencyList.get(id)?.size ?? 0
    const outC = graph.adjacencyList.get(id)?.size ?? 0
    fanIn.push({ nodeId: id, count: inC })
    fanOut.push({ nodeId: id, count: outC })
    if (inC === 0 && outC === 0) isolated.push(id)
  }
  fanIn.sort((a, b) => b.count - a.count)
  fanOut.sort((a, b) => b.count - a.count)
  return { highFanIn: fanIn, highFanOut: fanOut, isolatedNodes: isolated }
}
