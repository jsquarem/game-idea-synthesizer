'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { DETAIL_TYPES } from '@/lib/repositories/system-detail.repository'
import type { SystemDetail } from '@prisma/client'
import {
  createSystemDetailAction,
  updateSystemDetailAction,
  deleteSystemDetailAction,
} from '@/app/actions/system-detail.actions'

type Props = {
  projectId: string
  systemId: string
  systemDetails: SystemDetail[]
}

export function SystemDetails({ projectId, systemId, systemDetails }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">System details</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? 'Cancel' : 'Add system detail'}
        </Button>
      </div>

      {showAddForm && (
        <form
          action={createSystemDetailAction.bind(null, projectId, systemId)}
          className="rounded-md border border-border bg-muted/30 p-4 space-y-3"
        >
          <div>
            <label htmlFor="new-detail-name" className="mb-1 block text-sm font-medium">
              Name *
            </label>
            <input
              id="new-detail-name"
              name="name"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="new-detail-type" className="mb-1 block text-sm font-medium">
              Type
            </label>
            <select
              id="new-detail-type"
              name="detailType"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DETAIL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="new-detail-spec" className="mb-1 block text-sm font-medium">
              Spec (markdown)
            </label>
            <textarea
              id="new-detail-spec"
              name="spec"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Create
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {systemDetails.length === 0 && !showAddForm ? (
        <p className="text-sm text-muted-foreground">
          No system details yet. Add details to define what this system does (mechanics, inputs, outputs, etc.).
        </p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {systemDetails.map((b) => (
            <AccordionItem key={b.id} value={b.id}>
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <span>{b.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {b.detailType}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {editingId === b.id ? (
                  <form
                    action={updateSystemDetailAction.bind(
                      null,
                      projectId,
                      systemId,
                      b.id
                    )}
                    className="space-y-3 pt-2"
                  >
                    <input type="hidden" name="detailId" value={b.id} />
                    <div>
                      <label className="mb-1 block text-sm font-medium">Name *</label>
                      <input
                        name="name"
                        required
                        defaultValue={b.name}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Type</label>
                      <select
                        name="detailType"
                        defaultValue={b.detailType}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {DETAIL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Spec</label>
                      <textarea
                        name="spec"
                        rows={4}
                        defaultValue={b.spec}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2 pt-2">
                    {b.spec ? (
                      <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
                        {b.spec}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No spec.</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(b.id)}
                      >
                        Edit
                      </Button>
                      <form
                        action={deleteSystemDetailAction.bind(
                          null,
                          projectId,
                          systemId,
                          b.id
                        )}
                        className="inline"
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
