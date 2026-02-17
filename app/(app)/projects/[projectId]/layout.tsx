import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findProjectById } from '@/lib/repositories/project.repository'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await findProjectById(projectId)
  if (!project) notFound()

  const nav = [
    { href: `/projects/${projectId}/overview`, label: 'Overview' },
    { href: `/projects/${projectId}/brainstorms`, label: 'Brainstorms' },
    { href: `/projects/${projectId}/systems`, label: 'Systems' },
    { href: `/projects/${projectId}/dependencies`, label: 'Dependencies' },
    { href: `/projects/${projectId}/versions`, label: 'Versions' },
    { href: `/projects/${projectId}/prompts`, label: 'Prompts' },
    { href: `/projects/${projectId}/export`, label: 'Export' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{project.name}</span>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-border pb-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
