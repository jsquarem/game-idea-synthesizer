'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tab = 'paste' | 'freeform' | 'upload'

type Props = {
  projectId: string
  createAction: (projectId: string, formData: FormData) => Promise<void>
}

export function BrainstormNewForm({ projectId, createAction }: Props) {
  const [tab, setTab] = useState<Tab>('paste')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t])
      setTagInput('')
    }
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  return (
    <form
      action={(formData) => {
        formData.set('projectId', projectId)
        return createAction(projectId, formData)
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue="Untitled"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Input mode</span>
        <div className="flex gap-2">
          {(['paste', 'freeform', 'upload'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                tab === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              {t === 'paste' ? 'Paste' : t === 'freeform' ? 'Freeform' : 'Upload'}
            </button>
          ))}
        </div>
        <input type="hidden" name="source" value={tab === 'paste' ? 'manual' : tab === 'freeform' ? 'manual' : 'upload'} />
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium">
          Content *
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={12}
          placeholder={
            tab === 'paste'
              ? 'Paste your brainstorm (Discord thread, notes, etc.)…'
              : tab === 'freeform'
                ? 'Write your ideas in freeform or markdown…'
                : 'Paste or type content (file upload UI can be added later)…'
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="author" className="mb-1 block text-sm font-medium">
          Author *
        </label>
        <input
          id="author"
          name="author"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag…"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button type="button" onClick={addTag} className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
            Add
          </button>
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm"
            >
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive" aria-label={`Remove ${t}`}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Save session
        </button>
        <Link
          href={`/projects/${projectId}/brainstorms`}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
