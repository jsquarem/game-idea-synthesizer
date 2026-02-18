'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { FolderPlus, Search, FolderOpen, Lightbulb, Zap, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatCard } from '@/components/stat-card'
import { DashboardProjectCard } from '@/components/dashboard-project-card'
import type { ProjectCardProject } from '@/components/project-card'

type DashboardCounts = {
  total: number
  ideation: number
  active: number
  archived: number
} | null

type DashboardContentProps = {
  projects: ProjectCardProject[]
  counts: DashboardCounts
  initialSearch: string
  initialStatus: string
  initialSort: string
}

export function DashboardContent({
  projects,
  counts,
  initialSearch,
  initialStatus,
  initialSort,
}: DashboardContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(initialSearch)

  const updateParams = useCallback(
    (updates: { search?: string; status?: string; sort?: string }) => {
      const params = new URLSearchParams()
      const search = updates.search !== undefined ? updates.search : initialSearch
      const status = updates.status !== undefined ? updates.status : initialStatus
      const sort = updates.sort !== undefined ? updates.sort : initialSort
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (sort && sort !== 'recent') params.set('sort', sort)
      const q = params.toString()
      router.push(pathname + (q ? `?${q}` : ''))
    },
    [pathname, router, initialSearch, initialStatus, initialSort]
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchValue.trim() || undefined })
  }

  const statusLink = (status: string) => {
    const params = new URLSearchParams()
    if (initialSearch) params.set('search', initialSearch)
    if (status) params.set('status', status)
    if (initialSort && initialSort !== 'recent') params.set('sort', initialSort)
    const q = params.toString()
    return pathname + (q ? `?${q}` : '')
  }

  const showGrouped = !initialStatus && projects.length > 0
  const groups = showGrouped
    ? (['active', 'ideation', 'archived'] as const).map((status) => ({
        status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        projects: projects.filter((p) => p.status === status),
      })).filter((g) => g.projects.length > 0)
    : []

  return (
    <div className="space-y-8">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage your game design projects. Open any project to view systems, brainstorms, and version plans.
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">New Project</Link>
          </Button>
        </CardHeader>
      </Card>

      {counts && (
        <section>
          <h2 className="sr-only">Portfolio summary</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <li>
              <StatCard
                icon={FolderOpen}
                label="Total projects"
                value={counts.total}
              />
            </li>
            <li>
              <StatCard
                icon={Lightbulb}
                label="Ideation"
                value={counts.ideation}
                href={statusLink('ideation')}
              />
            </li>
            <li>
              <StatCard
                icon={Zap}
                label="Active"
                value={counts.active}
                href={statusLink('active')}
              />
            </li>
            <li>
              <StatCard
                icon={Archive}
                label="Archived"
                value={counts.archived}
                href={statusLink('archived')}
              />
            </li>
          </ul>
        </section>
      )}

      <Card className="rounded-xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9"
              />
            </form>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Status: {initialStatus || 'All'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateParams({ status: '' })}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateParams({ status: 'ideation' })}>
                  Ideation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateParams({ status: 'active' })}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateParams({ status: 'archived' })}>
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort: {initialSort === 'name' ? 'Name' : initialSort === 'updated' ? 'Updated' : 'Recent'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateParams({ sort: 'recent' })}>
                  Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateParams({ sort: 'updated' })}>
                  Last updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateParams({ sort: 'name' })}>
                  Name
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
              <FolderPlus className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first game design project to get started.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/projects/new">New Project</Link>
              </Button>
            </div>
          ) : showGrouped ? (
            <div className="space-y-8">
              {groups.map(({ status, label, projects: groupProjects }) => (
                <section key={status}>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {label}
                  </h3>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupProjects.map((project) => (
                      <li key={project.id} className="h-full min-h-0">
                        <DashboardProjectCard project={project} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <li key={project.id} className="h-full min-h-0">
                  <DashboardProjectCard project={project} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
