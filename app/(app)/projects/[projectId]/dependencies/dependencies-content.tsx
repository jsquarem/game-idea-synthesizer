'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  GitBranch,
  Link2,
  LayoutGrid,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/page-header'
import { DependencySidePanel } from '@/components/dependency-side-panel'
import { DependencyGraphCanvas } from '@/components/dependency-graph-canvas'
import { useGraphStore } from '@/store/graph-store'
import type { GameSystem } from '@prisma/client'
import { AddDependencyForm } from './add-dependency-form'
import { removeDependencyAction } from '@/app/actions/dependency.actions'
import { Skeleton } from '@/components/ui/skeleton'

type SystemForPanel = {
  id: string
  name: string
  systemSlug: string
  purpose: string | null
  status: string
  mvpCriticality: string
  dependsOn: { id: string; name: string; systemSlug: string }[]
  dependedOnBy: { id: string; name: string; systemSlug: string }[]
}

type DependenciesContentProps = {
  projectId: string
  edges: {
    sourceId: string
    sourceName: string
    targetId: string
    targetName: string
    type: string
    description: string | null
  }[]
  systemsForPanel: SystemForPanel[]
  systems: GameSystem[]
}

export function DependenciesContent({
  projectId,
  edges,
  systemsForPanel,
  systems,
}: DependenciesContentProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const {
    isEdgeEditMode,
    pendingEdgeSource,
    layoutEngine,
    layoutEngineUsed,
    setLayoutEngine,
    toggleEdgeEditMode,
  } = useGraphStore()
  const router = useRouter()
  const selectNode = useGraphStore((s) => s.selectNode)
  const [removingEdge, setRemovingEdge] = useState<string | null>(null)
  const flowApiRef = useRef<{ fitView: () => Promise<boolean>; zoomIn: () => void; zoomOut: () => void } | null>(null)
  const onFlowInit = useCallback((api: { fitView: () => Promise<boolean>; zoomIn: () => void; zoomOut: () => void }) => {
    flowApiRef.current = api
  }, [])
  const selectedSystem = selectedNodeId
    ? systemsForPanel.find((s) => s.id === selectedNodeId)
    : null

  const systemsForGraph = systems.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    mvpCriticality: s.mvpCriticality,
  }))
  const edgesForGraph = edges.map((e) => ({
    sourceId: e.sourceId,
    targetId: e.targetId,
    type: e.type,
    description: e.description ?? null,
  }))

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden gap-4">
      <div className="shrink-0">
        <PageHeader
          title="Systems interaction"
          description="View how systems interface with each other. Add links when one system uses or is triggered by another. Arrows show interaction flow (source → target)."
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[2fr_minmax(360px,1fr)] items-stretch overflow-hidden">
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardContent className="relative flex min-h-0 flex-1 flex-col p-0">
            <div className="absolute right-2 top-2 z-10 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                aria-label="Zoom in"
                title="Zoom in"
                onClick={() => flowApiRef.current?.zoomIn()}
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Zoom out"
                title="Zoom out"
                onClick={() => flowApiRef.current?.zoomOut()}
              >
                <ZoomOut className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Fit view"
                title="Fit all nodes in view"
                onClick={() => flowApiRef.current?.fitView()}
              >
                <Maximize2 className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Layout engine: Auto picks best; ELK or Graphviz to force one"
                  >
                    <LayoutGrid className="mr-1 size-4" />
                    {layoutEngine === 'auto'
                      ? layoutEngineUsed
                        ? `Auto (${layoutEngineUsed})`
                        : 'Layout'
                      : layoutEngine}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setLayoutEngine('auto')}>
                    Auto {layoutEngine === 'auto' && layoutEngineUsed && `(${layoutEngineUsed})`}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLayoutEngine('elk')}>
                    ELK
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLayoutEngine('graphviz')}>
                    Graphviz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" title="Filter by status or criticality">
                    <Filter className="mr-1 size-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <span className="px-2 py-1.5 text-sm text-muted-foreground">
                    Status / Criticality (Phase 2)
                  </span>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="secondary"
                size="sm"
                disabled
                title="Highlight downstream impact of a system"
              >
                <GitBranch className="mr-1 size-4" />
                Impact mode
              </Button>
              <Button
                variant={isEdgeEditMode ? 'default' : 'secondary'}
                size="sm"
                onClick={() => toggleEdgeEditMode()}
                aria-pressed={isEdgeEditMode}
                title="Add an interaction link: click source node then target node (source uses target)"
              >
                <Link2 className="mr-1 size-4" />
                {isEdgeEditMode
                  ? pendingEdgeSource
                    ? 'Click target node'
                    : 'Click source node'
                  : 'Add link'}
              </Button>
            </div>
            {systems.length === 0 ? (
              <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No systems in this project yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Add systems via synthesis or create them manually to see how they connect here.
                </p>
              </div>
            ) : (
              <DependencyGraphCanvas
                projectId={projectId}
                systems={systemsForGraph}
                edges={edgesForGraph}
                onInit={onFlowInit}
                className="min-h-0 h-full flex-1"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <div className="min-h-0 shrink-0">
            {selectedSystem ? (
              <DependencySidePanel system={selectedSystem} projectId={projectId} />
            ) : (
              <Card>
                <CardContent className="py-6 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Interaction links</h2>
              <p className="text-sm text-muted-foreground">
                Each row is a link: source uses or interfaces with target. Remove to break the link.
              </p>
            </CardHeader>
            <CardContent>
              {edges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No interaction links yet.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {edges.map((e) => {
                    const edgeKey = `${e.sourceId}-${e.targetId}`
                    const isRemoving = removingEdge === edgeKey
                    return (
                      <li
                        key={edgeKey}
                        className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => selectNode(e.sourceId)}
                              className="text-primary hover:underline"
                            >
                              {e.sourceName}
                            </button>
                            <span className="text-muted-foreground">→</span>
                            <button
                              type="button"
                              onClick={() => selectNode(e.targetId)}
                              className="text-primary hover:underline"
                            >
                              {e.targetName}
                            </button>
                          </div>
                          <div className="mt-0.5 text-muted-foreground">
                            {(e.description && e.description.trim()) || (
                              <span className="italic">— No description</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="col-start-2 row-span-2 self-center h-7 text-destructive hover:text-destructive"
                          disabled={isRemoving}
                          onClick={async () => {
                            setRemovingEdge(edgeKey)
                            await removeDependencyAction(projectId, e.sourceId, e.targetId)
                            setRemovingEdge(null)
                            router.refresh()
                          }}
                        >
                          {isRemoving ? 'Removing…' : 'Remove'}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Add interaction link</h2>
              <p className="text-sm text-muted-foreground">
                Connect two systems when one uses or is triggered by the other (e.g. Combat uses Roles, Quest Selection sends to Combat).
              </p>
            </CardHeader>
            <CardContent>
              <AddDependencyForm projectId={projectId} systems={systems} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
