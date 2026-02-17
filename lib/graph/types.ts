export type GraphNode = {
  id: string
  label: string
  metadata?: Record<string, unknown>
}

export type GraphEdge = {
  source: string
  target: string
  type: string
}

export type DirectedGraph = {
  nodes: Map<string, GraphNode>
  adjacencyList: Map<string, Set<string>>
  reverseAdjacencyList: Map<string, Set<string>>
}
