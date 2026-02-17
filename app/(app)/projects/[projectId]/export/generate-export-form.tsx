'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateExportAction } from '@/app/actions/export.actions'

type Props = { projectId: string }

export function GenerateExportForm({ projectId }: Props) {
  const router = useRouter()
  const [type, setType] = useState<string>('gdd')
  const [format, setFormat] = useState<string>('markdown')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const result = await generateExportAction(projectId, type, format)
    setPending(false)
    if (result?.ok === false) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="type" className="mb-1 block text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="gdd">Game Design Document</option>
          <option value="version_prd">Version PRD</option>
          <option value="system_doc">System doc</option>
          <option value="roadmap">Roadmap</option>
          <option value="prompt_bundle">Prompt bundle</option>
        </select>
      </div>
      <div>
        <label htmlFor="format" className="mb-1 block text-sm font-medium">
          Format
        </label>
        <select
          id="format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Generating…' : 'Generate'}
      </button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  )
}
