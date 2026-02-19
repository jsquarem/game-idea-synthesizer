'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getLayoutedFlow, type SystemForTransform, type EdgeForTransform } from '@/lib/graph/transform'
import { useGraphStore } from '@/store/graph-store'
import { SystemNode } from '@/components/dependency-graph-node'
import { DependencyGraphEdge } from '@/components/dependency-graph-edge'
import { addDependencyAction } from '@/app/actions/dependency.actions'

const nodeTypes = { systemNode: SystemNode } as NodeTypes
const edgeTypes = { dependencyEdge: DependencyGraphEdge } as EdgeTypes
const FIT_VIEW_OPTIONS = { padding: 0.18, minZoom: 0.2, maxZoom: 1.35 }

type DependencyGraphCanvasProps = {
  projectId: string
  systems: SystemForTransform[]
  edges: EdgeForTransform[]
  onInit?: (api: { fitView: () => Promise<boolean>; zoomIn: () => void; zoomOut: () => void }) => void
  className?: string
}

export function DependencyGraphCanvas({
  projectId,
  systems,
  edges,
  onInit,
  className,
}: DependencyGraphCanvasProps) {
  const router = useRouter()
  const {
    selectedNodeId,
    isEdgeEditMode,
    pendingEdgeSource,
    layoutDirection,
    layoutEngine,
    selectNode,
    setPendingEdgeSource,
    setLayoutEngineUsed,
    resetEdgeEditMode,
  } =
    useGraphStore()

  const [flowNodes, setFlowNodes] = useState<Node[]>([])
  const [flowEdges, setFlowEdges] = useState<Awaited<ReturnType<typeof getLayoutedFlow>>['edges']>([])
  const flowInstanceRef = useRef<{
    fitView: (opts?: { padding?: number; minZoom?: number; maxZoom?: number }) => Promise<boolean>
  } | null>(null)

  const layoutDataKey = useMemo(() => {
    const nodeIds = systems.map((s) => s.id).sort().join(',')
    const edgePairs = edges
      .map((e) => `${e.sourceId}-${e.targetId}`)
      .sort()
      .join(',')
    return `${nodeIds}|${edgePairs}`
  }, [systems, edges])

  const dataRef = useRef({ systems, edges })
  dataRef.current = { systems, edges }

  useEffect(() => {
    let cancelled = false
    const { systems: sys, edges: edgs } = dataRef.current
    if (sys.length === 0) {
      setFlowNodes([])
      setFlowEdges([])
      return
    }
    getLayoutedFlow(sys, edgs, layoutDirection, layoutEngine).then(
      ({ nodes, edges: layoutEdges, layoutEngineUsed }) => {
        if (!cancelled) {
          setFlowNodes(nodes)
          setFlowEdges(layoutEdges)
          setLayoutEngineUsed(layoutEngineUsed)
          requestAnimationFrame(() => {
            flowInstanceRef.current?.fitView(FIT_VIEW_OPTIONS)
          })
        }
      }
    )
    return () => {
      cancelled = true
    }
  }, [layoutDataKey, layoutDirection, layoutEngine, setLayoutEngineUsed])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeId = node.id
      if (isEdgeEditMode) {
        if (pendingEdgeSource == null) {
          setPendingEdgeSource(nodeId)
          return
        }
        if (pendingEdgeSource === nodeId) {
          resetEdgeEditMode()
          return
        }
        addDependencyAction(projectId, pendingEdgeSource, nodeId).then((result) => {
          resetEdgeEditMode()
          if (result?.ok !== false) {
            router.refresh()
          }
        })
        return
      }
      selectNode(selectedNodeId === nodeId ? null : nodeId)
    },
    [
      isEdgeEditMode,
      pendingEdgeSource,
      projectId,
      resetEdgeEditMode,
      router,
      selectNode,
      selectedNodeId,
      setPendingEdgeSource,
    ]
  )

  const nodesWithSelection = useMemo(() => {
    return flowNodes.map((n) => ({
      ...n,
      selected: n.id === selectedNodeId,
    }))
  }, [flowNodes, selectedNodeId])

  const onInitCallback = useCallback(
    (instance: {
      fitView: (opts?: { padding?: number; minZoom?: number; maxZoom?: number }) => Promise<boolean>
      zoomIn: () => void
      zoomOut: () => void
    }) => {
      flowInstanceRef.current = instance
      onInit?.({
        fitView: () => instance.fitView(FIT_VIEW_OPTIONS),
        zoomIn: () => instance.zoomIn(),
        zoomOut: () => instance.zoomOut(),
      })
    },
    [onInit]
  )

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 0 }}
    >
      <ReactFlow
        nodes={nodesWithSelection}
        edges={flowEdges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInitCallback}
        onPaneClick={isEdgeEditMode ? undefined : () => selectNode(null)}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background
          id="flowchart-minor"
          variant={BackgroundVariant.Lines}
          gap={24}
          lineWidth={1}
          color="rgba(80, 80, 100, 0.35)"
        />
        <Background
          id="flowchart-major"
          variant={BackgroundVariant.Lines}
          gap={120}
          lineWidth={1.5}
          color="rgba(120, 120, 140, 0.5)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
