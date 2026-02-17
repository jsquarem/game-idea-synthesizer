import Link from 'next/link'

export default function NewPromptPage() {
  return (
    <div className="space-y-6">
      <Link href=".." className="text-sm text-muted-foreground hover:text-foreground">
        ← Prompt history
      </Link>
      <h1 className="text-2xl font-bold">Prompt Generator</h1>
      <p className="text-muted-foreground">
        AI prompt generator and template selection will be wired in Phase 7 (AI engine).
      </p>
    </div>
  )
}
