import Link from 'next/link'

export default function BrainstormNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h1 className="text-xl font-semibold">Brainstorm session not found</h1>
      <Link href="/dashboard" className="text-primary hover:underline">
        Back to Dashboard
      </Link>
    </div>
  )
}
