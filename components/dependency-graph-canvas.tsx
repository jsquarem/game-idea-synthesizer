'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { transformToReactFlow, type SystemForTransform, type EdgeForTransform } from '@/lib/graph/transform'
import { useGraphStore } from '@/store/graph-store'
import { SystemNode } from '@/components/dependency-graph-node'
import { addDependencyAction } from '@/app/actions/dependency.actions'

const nodeTypes = { systemNode: SystemNode } as NodeTypes

type DependencyGraphCanvasProps = {
  projectId: string
  systems: SystemForTransform[]
  edges: EdgeForTransform[]
  className?: string
}

export function DependencyGraphCanvas({
  projectId,
  systems,
  edges,
  className,
}: DependencyGraphCanvasProps) {
  const router = useRouter()
  const { selectedNodeId, isEdgeEditMode, pendingEdgeSource, selectNode, setPendingEdgeSource, resetEdgeEditMode } =
    useGraphStore()

  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => transformToReactFlow(systems, edges, 'TB'),
    [systems, edges]
  )

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
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onPaneClick={isEdgeEditMode ? undefined : () => selectNode(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
