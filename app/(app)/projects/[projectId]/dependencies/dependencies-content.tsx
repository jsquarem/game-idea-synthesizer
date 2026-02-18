'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutDashboard,
  Filter,
  GitBranch,
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
import type { GameSystem } from '@prisma/client'
import { AddDependencyForm } from './add-dependency-form'

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
  edges: {
    sourceId: string
    sourceName: string
    targetId: string
    targetName: string
    type: string
  }[]
  systemsForPanel: SystemForPanel[]
  systems: GameSystem[]
}

export function DependenciesContent({
  projectId,
  implementationOrder,
  edges,
  systemsForPanel,
  systems,
}: DependenciesContentProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const selectedSystem = selectedSystemId
    ? systemsForPanel.find((s) => s.id === selectedSystemId)
    : null

  return (
    <div className="space-y-6">
      <PageHeader title="Dependency Graph" />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        <div className="space-y-4">
          <Card className="min-h-[70vh]">
            <CardContent className="relative p-0">
              <div className="absolute right-2 top-2 z-10 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="icon" aria-label="Zoom in" disabled>
                  <ZoomIn className="size-4" />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Zoom out" disabled>
                  <ZoomOut className="size-4" />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Fit view" disabled>
                  <Maximize2 className="size-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <LayoutDashboard className="mr-1 size-4" />
                      Layout
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <span className="px-2 py-1.5 text-sm text-muted-foreground">
                      Hierarchical / Force / LTR (coming with graph)
                    </span>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <Filter className="mr-1 size-4" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <span className="px-2 py-1.5 text-sm text-muted-foreground">
                      Status / Criticality (coming with graph)
                    </span>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="secondary" size="sm" disabled>
                  <GitBranch className="mr-1 size-4" />
                  Impact mode
                </Button>
              </div>
              <div className="flex min-h-[70vh] items-center justify-center p-8">
                <p className="text-muted-foreground">Graph coming soon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Implementation order</h2>
            </CardHeader>
            <CardContent>
              {implementationOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No systems or no dependencies yet.
                </p>
              ) : (
                <ol className="list-inside list-decimal space-y-1 font-mono text-sm">
                  {implementationOrder.map(({ id, label }) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSystemId(id)}
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
              <h2 className="text-lg font-semibold">Edges</h2>
            </CardHeader>
            <CardContent>
              {edges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dependencies defined.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {edges.map((e) => (
                    <li key={`${e.sourceId}-${e.targetId}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedSystemId(e.sourceId)}
                        className="text-primary hover:underline"
                      >
                        {e.sourceName}
                      </button>
                      {' → '}
                      <button
                        type="button"
                        onClick={() => setSelectedSystemId(e.targetId)}
                        className="text-primary hover:underline"
                      >
                        {e.targetName}
                      </button>
                      <span className="ml-2 text-muted-foreground">({e.type})</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Add dependency</h2>
            </CardHeader>
            <CardContent>
              <AddDependencyForm projectId={projectId} systems={systems} />
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          {selectedSystem ? (
            <DependencySidePanel system={selectedSystem} projectId={projectId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  Click a system in the implementation order or edges list to view details.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href={`/projects/${projectId}/dependencies`}>View all</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
