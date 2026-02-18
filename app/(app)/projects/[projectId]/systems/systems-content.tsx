'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, LayoutGrid, List, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { SystemCard } from '@/components/system-card'
import { StatusBadge } from '@/components/status-badge'
import { CriticalityBadge } from '@/components/criticality-badge'
import type { SystemCardSystem } from '@/components/system-card'

type SystemsContentProps = {
  projectId: string
  systems: SystemCardSystem[]
  initialSearch: string
  initialStatus: string
  initialCriticality: string
  initialView: 'grid' | 'table'
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(new Date(d))
}

export function SystemsContent({
  projectId,
  systems,
  initialSearch,
  initialStatus,
  initialCriticality,
  initialView,
}: SystemsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const [view, setView] = useState<'grid' | 'table'>(initialView)

  const updateParams = useCallback(
    (updates: { search?: string; status?: string; criticality?: string; view?: 'grid' | 'table' }) => {
      const params = new URLSearchParams()
      const search = updates.search !== undefined ? updates.search : initialSearch
      const status = updates.status !== undefined ? updates.status : initialStatus
      const criticality = updates.criticality !== undefined ? updates.criticality : initialCriticality
      const viewParam = updates.view !== undefined ? updates.view : view
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (criticality) params.set('criticality', criticality)
      if (viewParam === 'table') params.set('view', 'table')
      const q = params.toString()
      router.push(pathname + (q ? `?${q}` : ''))
      if (updates.view !== undefined) setView(updates.view)
    },
    [pathname, router, initialSearch, initialStatus, initialCriticality, view]
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchValue.trim() || undefined })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Systems"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-1">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateParams({ view: 'grid' })}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateParams({ view: 'table' })}
                aria-label="Table view"
              >
                <List className="size-4" />
              </Button>
            </div>
            <Button asChild>
              <Link href={`/projects/${projectId}/systems/new`}>New System</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search systems..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Status: {initialStatus || 'All'}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => updateParams({ status: '' })}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateParams({ status: 'draft' })}>Draft</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateParams({ status: 'active' })}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateParams({ status: 'deprecated' })}>
              Deprecated
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Criticality: {initialCriticality || 'All'}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => updateParams({ criticality: '' })}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateParams({ criticality: 'core' })}>Core</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateParams({ criticality: 'important' })}>
              Important
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateParams({ criticality: 'later' })}>Later</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {systems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <Boxes className="size-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Create your first system</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define game systems and their dependencies.
          </p>
          <Button className="mt-6" asChild>
            <Link href={`/projects/${projectId}/systems/new`}>New System</Link>
          </Button>
        </div>
      ) : view === 'grid' ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => (
            <li key={system.id}>
              <SystemCard system={system} projectId={projectId} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Dependencies</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((system) => (
                <TableRow
                  key={system.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${projectId}/systems/${system.id}`)}
                >
                  <TableCell className="font-medium">{system.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{system.systemSlug}</TableCell>
                  <TableCell>
                    <StatusBadge status={system.status} />
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge value={system.mvpCriticality} />
                  </TableCell>
                  <TableCell>{system.version ?? '—'}</TableCell>
                  <TableCell>{system.dependencyCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(system.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
