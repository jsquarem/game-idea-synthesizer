'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProjectAction, type UpdateProjectResult } from '@/app/actions/project.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@prisma/client'

type Props = {
  project: Project
}

export function ProjectEditForm({ project }: Props) {
  const router = useRouter()
  const action = (prev: UpdateProjectResult | null, formData: FormData) =>
    updateProjectAction(project.id, prev, formData)
  const [state, formAction] = useActionState(action, null)

  useEffect(() => {
    if (state?.ok) router.push(`/projects/${project.id}/overview`)
  }, [state, project.id, router])

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name *
        </label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={project.name}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={project.description ?? ''}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div>
        <label htmlFor="genre" className="mb-1 block text-sm font-medium">
          Genre
        </label>
        <Input
          id="genre"
          name="genre"
          defaultValue={project.genre ?? ''}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="platform" className="mb-1 block text-sm font-medium">
          Platform
        </label>
        <Input
          id="platform"
          name="platform"
          defaultValue={project.platform ?? ''}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={project.status}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ideation">Ideation</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {state && !state.ok && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit">Save changes</Button>
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}/overview`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
