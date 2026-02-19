'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutDashboard,
  Filter,
  GitBranch,
  Link2,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/page-header'
import { DependencySidePanel } from '@/components/dependency-side-panel'
import { DependencyGraphCanvas } from '@/components/dependency-graph-canvas'
import { useGraphStore } from '@/store/graph-store'
import type { GameSystem } from '@prisma/client'
import { AddDependencyForm } from './add-dependency-form'
import { removeDependencyAction } from '@/app/actions/dependency.actions'

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
  implementationOrder: { id: string; label: string }[]
  hasCycles?: boolean
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
  implementationOrder,
  hasCycles = false,
  edges,
  systemsForPanel,
  systems,
}: DependenciesContentProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const { isEdgeEditMode, pendingEdgeSource, toggleEdgeEditMode } = useGraphStore()
  const router = useRouter()
  const selectNode = useGraphStore((s) => s.selectNode)
  const [removingEdge, setRemovingEdge] = useState<string | null>(null)
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
                disabled
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Zoom out"
                title="Zoom out"
                disabled
              >
                <ZoomOut className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Fit view"
                title="Fit all nodes in view"
                disabled
              >
                <Maximize2 className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" title="Graph layout direction">
                    <LayoutDashboard className="mr-1 size-4" />
                    Layout
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <span className="px-2 py-1.5 text-sm text-muted-foreground">
                    Hierarchical / Force / LTR (Phase 2)
                  </span>
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
                <CardContent className="flex flex-col items-center justify-center text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Click a system in the graph or lists to view details.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Here you&apos;ll see the system&apos;s purpose, status, and how it connects to other systems.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href={`/projects/${projectId}/dependencies`}>View all</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Suggested build order</h2>
              <p className="text-sm text-muted-foreground">
                Computed from the graph above so systems that others depend on come first.
              </p>
            </CardHeader>
            <CardContent>
              {implementationOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {hasCycles
                    ? 'Graph contains cycles (natural for systems interaction). A single build order is not defined.'
                    : 'No systems or no dependencies yet.'}
                </p>
              ) : (
                <ol className="list-inside list-decimal space-y-1 font-mono text-sm">
                  {implementationOrder.map(({ id, label }) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => selectNode(id)}
                        className="text-primary hover:underline"
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

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
                <ul className="space-y-2 text-sm">
                  {edges.map((e) => {
                    const edgeKey = `${e.sourceId}-${e.targetId}`
                    const isRemoving = removingEdge === edgeKey
                    return (
                      <li
                        key={edgeKey}
                        className="flex flex-wrap items-center gap-1 gap-y-0.5"
                      >
                        <button
                          type="button"
                          onClick={() => selectNode(e.sourceId)}
                          className="text-primary hover:underline"
                        >
                          {e.sourceName}
                        </button>
                        {' → '}
                        <button
                          type="button"
                          onClick={() => selectNode(e.targetId)}
                          className="text-primary hover:underline"
                        >
                          {e.targetName}
                        </button>
                        <span className="ml-1 text-muted-foreground">({e.type})</span>
                        {e.description ? (
                          <span className="ml-1 text-muted-foreground">— {e.description}</span>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-7 text-destructive hover:text-destructive"
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
