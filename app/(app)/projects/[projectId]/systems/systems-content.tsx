'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Boxes, ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { CriticalityBadge } from '@/components/criticality-badge'
import { SystemEvolveChat } from '@/components/system-evolve-chat'
import type { GameSystemListItemWithDetails } from '@/lib/repositories/game-system.repository'

type SystemsContentProps = {
  projectId: string
  systems: GameSystemListItemWithDetails[]
  initialSearch: string
  initialStatus: string
  initialCriticality: string
  providerConfigs: { providerId: string; defaultModel: string | null; availableModels?: string[] }[]
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(new Date(d))
}

const PURPOSE_SNIPPET_LEN = 120

export function SystemsContent({
  projectId,
  systems,
  initialSearch,
  initialStatus,
  initialCriticality,
  providerConfigs,
}: SystemsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const [expanded, setExpanded] = useState<string[]>([])

  const updateParams = useCallback(
    (updates: { search?: string; status?: string; criticality?: string }) => {
      const params = new URLSearchParams()
      const search = updates.search !== undefined ? updates.search : initialSearch
      const status = updates.status !== undefined ? updates.status : initialStatus
      const criticality = updates.criticality !== undefined ? updates.criticality : initialCriticality
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (criticality) params.set('criticality', criticality)
      const q = params.toString()
      router.push(pathname + (q ? `?${q}` : ''))
    },
    [pathname, router, initialSearch, initialStatus, initialCriticality]
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchValue.trim() || undefined })
  }

  const handleSystemUpdated = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Systems"
        actions={
          <Button asChild>
            <Link href={`/projects/${projectId}/systems/new`}>New System</Link>
          </Button>
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
      ) : (
        <Accordion
          type="multiple"
          value={expanded}
          onValueChange={setExpanded}
          className="rounded-xl border border-border"
        >
          {systems.map((system) => {
            const purposeStr = system.purpose ?? ''
            const purposeSnippet =
              purposeStr.length > PURPOSE_SNIPPET_LEN
                ? purposeStr.slice(0, PURPOSE_SNIPPET_LEN) + '…'
                : purposeStr
            const dependencyCount = system._count?.dependsOn ?? 0
            return (
              <AccordionItem key={system.id} value={system.id}>
                <AccordionTrigger className="flex min-h-[4rem] items-center gap-2 py-4 text-left hover:no-underline [&>svg]:shrink-0">
                  <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-medium">{system.name}</span>
                      <StatusBadge status={system.status} />
                      <CriticalityBadge value={system.mvpCriticality} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {system.systemSlug}
                    </span>
                    {purposeSnippet && (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {purposeSnippet}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span>{dependencyCount} dependenc{dependencyCount === 1 ? 'y' : 'ies'}</span>
                    <span>{formatDate(system.updatedAt)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border bg-muted/20 px-4 pb-4 pt-3">
                  <div className="space-y-4">
                    {system.purpose && (
                      <section>
                        <h4 className="text-sm font-medium">Purpose</h4>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                          {system.purpose}
                        </p>
                      </section>
                    )}
                    <section>
                      <h4 className="text-sm font-medium">System details</h4>
                      {system.systemDetails.length === 0 ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          No system details yet.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {system.systemDetails.map((d) => (
                            <li
                              key={d.id}
                              className="rounded-md border border-border/50 bg-background p-2"
                            >
                              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{d.name}</span>
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                                  {d.detailType}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-xs text-foreground">
                                {d.spec || '—'}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects/${projectId}/systems/${system.id}`}>
                          Open full system
                        </Link>
                      </Button>
                    </div>
                    {expanded.includes(system.id) && (
                      <SystemEvolveChat
                        projectId={projectId}
                        systemId={system.id}
                        providerConfigs={providerConfigs}
                        onSystemUpdated={handleSystemUpdated}
                      />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}
