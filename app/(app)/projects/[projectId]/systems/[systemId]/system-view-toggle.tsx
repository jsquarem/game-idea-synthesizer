'use client'

import type { GameSystemWithRelations } from '@/lib/repositories/game-system.repository'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  system: GameSystemWithRelations
  projectId: string
  systemId: string
  updateAction: (
    projectId: string,
    systemId: string,
    formData: FormData
  ) => Promise<void>
  formComponent: React.ReactNode
}

export function SystemViewToggle({
  system,
  projectId,
  systemId,
  updateAction,
  formComponent,
}: Props) {
  const markdown = system.markdownContent ?? ''

  return (
    <Tabs defaultValue="structured" className="w-full">
      <TabsList className="grid w-full max-w-[280px] grid-cols-2">
        <TabsTrigger value="structured">Structured</TabsTrigger>
        <TabsTrigger value="markdown">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="structured" className="mt-4">
        {formComponent}
      </TabsContent>
      <TabsContent value="markdown" className="mt-4">
        <form
          action={(formData: FormData) => updateAction(projectId, systemId, formData)}
          className="space-y-4"
        >
          <input type="hidden" name="changeSummary" value="Updated from markdown" />
          <input type="hidden" name="name" value={system.name} />
          <input type="hidden" name="version" value={system.version} />
          <input type="hidden" name="status" value={system.status} />
          <input type="hidden" name="purpose" value={system.purpose ?? ''} />
          <input type="hidden" name="mvpCriticality" value={system.mvpCriticality} />
          <Card>
            <CardContent className="pt-6">
              <label htmlFor="md" className="mb-2 block text-sm font-medium">
                Markdown (read-only; edit via Structured view)
              </label>
              <pre
                id="md"
                className="max-h-[60vh] overflow-auto rounded-md border border-input bg-muted/20 p-4 font-mono text-sm whitespace-pre-wrap"
              >
                {markdown || '(No markdown content)'}
              </pre>
            </CardContent>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  )
}
