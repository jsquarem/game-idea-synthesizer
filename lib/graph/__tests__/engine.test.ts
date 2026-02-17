import { describe, it, expect } from 'vitest'
import {
  buildGraph,
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  detectCycles,
  wouldCreateCycle,
  topologicalSort,
  getDirectUpstream,
  getDirectDownstream,
  getTransitiveUpstream,
  getTransitiveDownstream,
  validateScope,
  analyzeImpact,
  extractSubgraph,
  topologicalSortSubset,
} from '../graph-engine'
import type { GraphNode, GraphEdge } from '../types'

function node(id: string, label?: string): GraphNode {
  return { id, label: label ?? id }
}

function edge(source: string, target: string): GraphEdge {
  return { source, target, type: 'requires' }
}

describe('graph-engine', () => {
  describe('Graph construction', () => {
    it('should create an empty graph', () => {
      const g = buildGraph([], [])
      expect(g.nodes.size).toBe(0)
      expect(g.adjacencyList.size).toBe(0)
    })

    it('should add a single node', () => {
      const g = buildGraph([node('A')], [])
      expect(g.nodes.size).toBe(1)
      expect(g.nodes.get('A')).toEqual({ id: 'A', label: 'A' })
      expect(g.adjacencyList.get('A')?.size).toBe(0)
    })

    it('should add an edge between two nodes', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      expect(g.adjacencyList.get('A')?.has('B')).toBe(true)
      expect(g.reverseAdjacencyList.get('B')?.has('A')).toBe(true)
    })

    it('should ignore edge to non-existent node', () => {
      const g = buildGraph([node('A')], [edge('A', 'B')])
      expect(g.adjacencyList.get('A')?.has('B')).toBe(false)
    })

    it('should allow duplicate edges as single edge (Set semantics)', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B'), edge('A', 'B')])
      expect(g.adjacencyList.get('A')?.size).toBe(1)
    })
  })

  describe('Cycle detection', () => {
    it('should detect no cycle in a linear DAG: A → B → C', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')]
      )
      expect(detectCycles(g)).toEqual([])
    })

    it('should detect no cycle in a diamond DAG: A → B, A → C, B → D, C → D', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C'), node('D')],
        [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')]
      )
      expect(detectCycles(g)).toEqual([])
    })

    it('should detect direct cycle: A → B → A', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B'), edge('B', 'A')])
      const cycles = detectCycles(g)
      expect(cycles.length).toBeGreaterThanOrEqual(1)
      const flat = cycles.flat()
      expect(flat).toContain('A')
      expect(flat).toContain('B')
    })

    it('should detect indirect cycle: A → B → C → A', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C'), edge('C', 'A')]
      )
      const cycles = detectCycles(g)
      expect(cycles.length).toBeGreaterThanOrEqual(1)
      expect(cycles.flat()).toContain('A')
      expect(cycles.flat()).toContain('B')
      expect(cycles.flat()).toContain('C')
    })

    it('should report no cycle in empty graph', () => {
      const g = buildGraph([], [])
      expect(detectCycles(g)).toEqual([])
    })

    it('should report no cycle in single-node graph', () => {
      const g = buildGraph([node('A')], [])
      expect(detectCycles(g)).toEqual([])
    })

    it('should detect self-loop: A → A', () => {
      const g = buildGraph([node('A')], [edge('A', 'A')])
      const cycles = detectCycles(g)
      expect(cycles.length).toBeGreaterThanOrEqual(1)
      expect(cycles.flat()).toContain('A')
    })
  })

  describe('wouldCreateCycle', () => {
    it('should return true for self-loop', () => {
      const g = buildGraph([node('A')], [])
      expect(wouldCreateCycle(g, 'A', 'A')).toBe(true)
    })

    it('should return true when adding edge would create cycle', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      expect(wouldCreateCycle(g, 'B', 'A')).toBe(true)
    })

    it('should return false when adding edge keeps DAG', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      expect(wouldCreateCycle(g, 'A', 'B')).toBe(false)
    })
  })

  describe('addEdge (cycle-safe)', () => {
    it('should add edge when no cycle', () => {
      const g = buildGraph([node('A'), node('B')], [])
      expect(addEdge(g, 'A', 'B')).toBe(true)
      expect(g.adjacencyList.get('A')?.has('B')).toBe(true)
    })

    it('should reject edge that would create cycle', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      expect(addEdge(g, 'B', 'A')).toBe(false)
      expect(g.adjacencyList.get('B')?.has('A')).toBe(false)
    })
  })

  describe('Topological sort', () => {
    it('should return single node for single-node graph', () => {
      const g = buildGraph([node('A')], [])
      expect(topologicalSort(g)).toEqual(['A'])
    })

    it('should return correct order for linear chain: A → B → C', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')]
      )
      const order = topologicalSort(g)!
      expect(order).toHaveLength(3)
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'))
      expect(order.indexOf('B')).toBeLessThan(order.indexOf('C'))
    })

    it('should return valid order for diamond: A → B, A → C, B → D, C → D', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C'), node('D')],
        [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')]
      )
      const order = topologicalSort(g)!
      expect(order).toHaveLength(4)
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'))
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('C'))
      expect(order.indexOf('B')).toBeLessThan(order.indexOf('D'))
      expect(order.indexOf('C')).toBeLessThan(order.indexOf('D'))
    })

    it('should return null for cyclic graph', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B'), edge('B', 'A')])
      expect(topologicalSort(g)).toBeNull()
    })

    it('should return deterministic order for equivalent choices', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('A', 'C')]
      )
      const first = topologicalSort(g)!
      const second = topologicalSort(g)!
      expect(first).toEqual(second)
    })
  })

  describe('validateScope', () => {
    it('should be valid when scope includes all dependencies', () => {
      const g = buildGraph(
        [node('A'), node('B')],
        [edge('A', 'B')]
      )
      // In this graph, B has no deps; A depends on B. So scope [A, B] is valid.
      const result = validateScope(g, new Set(['A', 'B']))
      expect(result.valid).toBe(true)
      expect(result.missingDependencies).toHaveLength(0)
    })

    it('should be invalid when scope misses dependency', () => {
      const g = buildGraph(
        [node('A'), node('B')],
        [edge('A', 'B')]
      )
      // Edge A→B: reverseAdjacencyList(B)=A, so B depends on A. Scope [B] only: B needs A, missing A.
      const result = validateScope(g, new Set(['B']))
      expect(result.valid).toBe(false)
      expect(result.missingDependencies.some((m) => m.nodeId === 'B' && m.missingDep === 'A')).toBe(true)
    })
  })

  describe('getDirectUpstream / getDirectDownstream', () => {
    it('should return direct upstream (targets of out-edges)', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      expect(getDirectUpstream(g, 'A')).toEqual(['B'])
      expect(getDirectUpstream(g, 'B')).toEqual([])
    })

    it('should return direct downstream (sources of in-edges)', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      expect(getDirectDownstream(g, 'B')).toEqual(['A'])
      expect(getDirectDownstream(g, 'A')).toEqual([])
    })
  })

  describe('getTransitiveUpstream / getTransitiveDownstream', () => {
    it('should return transitive downstream for root node', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')]
      )
      const down = getTransitiveDownstream(g, 'C')
      expect(down).toContain('A')
      expect(down).toContain('B')
      expect(down).toHaveLength(2)
    })

    it('should return transitive upstream for leaf node', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')]
      )
      const up = getTransitiveUpstream(g, 'A')
      expect(up).toContain('B')
      expect(up).toContain('C')
      expect(up).toHaveLength(2)
    })
  })

  describe('analyzeImpact', () => {
    it('should return empty impact for leaf node (no dependents)', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      // A has no in-edges, so nothing depends on A
      const impact = analyzeImpact(g, 'A')
      expect(impact.directDownstream).toEqual([])
      expect(impact.transitiveDownstream).toEqual([])
    })

    it('should return direct dependents for root node', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      // B has in-edge from A, so A depends on B
      const impact = analyzeImpact(g, 'B')
      expect(impact.directDownstream).toContain('A')
    })
  })

  describe('extractSubgraph / topologicalSortSubset', () => {
    it('should extract subgraph with only given nodes and internal edges', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')]
      )
      const sub = extractSubgraph(g, new Set(['A', 'B']))
      expect(sub.nodes.size).toBe(2)
      expect(sub.nodes.has('A')).toBe(true)
      expect(sub.nodes.has('B')).toBe(true)
      expect(sub.adjacencyList.get('A')?.has('B')).toBe(true)
    })

    it('should return valid order for subset', () => {
      const g = buildGraph(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')]
      )
      const order = topologicalSortSubset(g, new Set(['A', 'B', 'C']))
      expect(order).toHaveLength(3)
      expect(order!.indexOf('A')).toBeLessThan(order!.indexOf('B'))
      expect(order!.indexOf('B')).toBeLessThan(order!.indexOf('C'))
    })
  })

  describe('removeNode / removeEdge', () => {
    it('should remove node and its edges', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      removeNode(g, 'A')
      expect(g.nodes.has('A')).toBe(false)
      expect(g.adjacencyList.has('A')).toBe(false)
      expect(g.reverseAdjacencyList.get('B')?.has('A')).toBe(false)
    })

    it('should remove edge', () => {
      const g = buildGraph([node('A'), node('B')], [edge('A', 'B')])
      removeEdge(g, 'A', 'B')
      expect(g.adjacencyList.get('A')?.has('B')).toBe(false)
      expect(g.reverseAdjacencyList.get('B')?.has('A')).toBe(false)
    })
  })
})
