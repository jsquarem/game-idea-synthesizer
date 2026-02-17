import Link from 'next/link'

export default function SynthesizePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Synthesize</h1>
      <p className="text-muted-foreground">
        The 4-step synthesis wizard (configure → processing → review → convert) will be implemented in Phase 7.
      </p>
      <Link href=".." className="text-primary hover:underline">
        ← Back to session
      </Link>
    </div>
  )
}
